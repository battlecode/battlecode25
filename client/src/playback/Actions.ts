import Round from './Round'
import { schema } from 'battlecode-schema'
import { unionToAction } from 'battlecode-schema/js/battlecode/schema/action'
import assert from 'assert'
import * as renderUtils from '../util/RenderUtil'
import { vectorAdd, vectorLength, vectorMultiply, vectorSub, vectorMultiplyInPlace, Vector } from './Vector'
import Match from './Match'
import { getImageIfLoaded } from '../util/ImageLoader'

type ActionUnion = Exclude<ReturnType<typeof unionToAction>, null>

export default class Actions {
    actions: Action<ActionUnion>[] = []

    constructor() {}

    applyTurnDelta(round: Round, turn: schema.Turn): void {
        const robotId = turn.robotId()

        if (turn.actionsLength() > 0) {
            for (let i = 0; i < turn.actionsTypeLength(); i++) {
                const actionType = turn.actionsType(i)!
                const action =
                    unionToAction(actionType, (obj) => turn.actions(i, obj)) ?? assert.fail('Failed to parse action')

                // TODO: think about revisiting this
                const actionClass =
                    ACTION_DEFINITIONS[actionType] ??
                    assert.fail(`Action ${actionType} not found in ACTION_DEFINITIONS`)
                const newAction = new actionClass(robotId, action)

                this.actions.push(newAction)
                newAction.apply(round)
            }
        }
    }

    tickLifetimes(): void {
        // Tick lifetimes of applied actions
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].duration--
            if (this.actions[i].duration == 0) {
                this.actions.splice(i, 1)
                i--
            }
        }
    }

    copy(): Actions {
        const newActions = new Actions()
        newActions.actions = this.actions.map((action) => action.copy())
        return newActions
    }

    draw(match: Match, ctx: CanvasRenderingContext2D) {
        for (const action of this.actions) {
            action.draw(match, ctx)
        }
    }
}

export class Action<T extends ActionUnion> {
    constructor(
        protected robotId: number,
        protected actionData: T,
        public duration: number = 1
    ) {}

    /**
     * Applies this action to the round provided. If stat is provided, it will be mutated to reflect the action as well
     *
     * @param round the round to apply this action to
     * @param stat if provided, this action will mutate the stat to reflect the action
     */
    apply(round: Round): void {}

    draw(match: Match, ctx: CanvasRenderingContext2D) {}

    copy(): Action<T> {
        // creates a new object using this object's prototype and all its parameters. this is a shallow copy, override this if you need a deep copy
        return Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
    }
}

export const ACTION_DEFINITIONS: Record<schema.Action, typeof Action<ActionUnion>> = {
    [schema.Action.NONE]: class NONE extends Action<ActionUnion> {
        apply(round: Round): void {
            throw new Error("yoo what !?! this shouldn't happen! :( (NONE action)")
        }
    },
    [schema.Action.DamageAction]: class DamageAction extends Action<schema.DamageAction> {
        apply(round: Round): void {
            const src = round.bodies.getById(this.robotId)
            const target = round.bodies.getById(this.actionData.id())

            const damage = this.actionData.damage()
            if (src.robotType === schema.RobotType.MOPPER) {
                // Apply paint damage to the target
                target.paint = Math.max(target.paint - damage, 0)
            } else {
                // Apply HP damage to the target
                target.hp = Math.max(target.hp - damage, 0)
            }
        }
    },
    [schema.Action.SplashAction]: class SplashAction extends Action<schema.SplashAction> {
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const body = match.currentRound.bodies.getById(this.robotId)
            const pos = match.map.indexToLocation(this.actionData.loc())
            const coords = renderUtils.getRenderCoords(pos.x, pos.y, match.map.dimension, true)

            ctx.strokeStyle = body.team.color
            ctx.globalAlpha = 0.3
            ctx.fillStyle = body.team.color
            ctx.beginPath()
            ctx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    },
    [schema.Action.AttackAction]: class AttackAction extends Action<schema.AttackAction> {
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const srcBody = match.currentRound.bodies.getById(this.robotId)
            const dstBody = match.currentRound.bodies.getById(this.actionData.id())

            let from, to
            if (srcBody.robotType === schema.RobotType.MOPPER) {
                // For moppers, reverse the direction of the 'attack' since it represents
                // taking paint from the other robot
                from = dstBody.getInterpolatedCoords(match)
                to = srcBody.getInterpolatedCoords(match)
            } else {
                from = srcBody.getInterpolatedCoords(match)
                to = dstBody.getInterpolatedCoords(match)
            }

            // Compute the start and end points for the animation projectile
            const dir = vectorSub(to, from)
            const len = vectorLength(dir)
            vectorMultiplyInPlace(dir, 1 / len)
            const projectileStart = vectorAdd(from, vectorMultiply(dir, len * match.getInterpolationFactor()))
            const projectileEnd = vectorAdd(
                from,
                vectorMultiply(dir, len * Math.min(match.getInterpolationFactor() + 0.2, 1.0))
            )

            // True direction
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(from.x, from.y, match.currentRound.map.staticMap.dimension),
                renderUtils.getRenderCoords(to.x, to.y, match.currentRound.map.staticMap.dimension),
                {
                    teamForOffset: srcBody.team,
                    color: srcBody.team.color,
                    lineWidth: 0.06,
                    opacity: 0.5,
                    renderArrow: false
                }
            )

            // Projectile animation
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(
                    projectileStart.x,
                    projectileStart.y,
                    match.currentRound.map.staticMap.dimension
                ),
                renderUtils.getRenderCoords(
                    projectileEnd.x,
                    projectileEnd.y,
                    match.currentRound.map.staticMap.dimension
                ),
                {
                    teamForOffset: srcBody.team,
                    color: srcBody.team.color,
                    lineWidth: 0.06,
                    opacity: 1.0,
                    renderArrow: false
                }
            )
        }
    },
    [schema.Action.PaintAction]: class PaintAction extends Action<schema.PaintAction> {
        apply(round: Round): void {
            const teamId = round.bodies.getById(this.robotId).team.id - 1
            const paintVal = teamId * 2 + 1 + this.actionData.isSecondary()
            round.map.paint[this.actionData.loc()] = paintVal
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const body = match.currentRound.bodies.getById(this.robotId)
            const pos = body.getInterpolatedCoords(match)

            const target = match.map.indexToLocation(this.actionData.loc())
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(pos.x, pos.y, match.currentRound.map.staticMap.dimension),
                renderUtils.getRenderCoords(target.x, target.y, match.currentRound.map.staticMap.dimension),
                {
                    color: body.team.color,
                    lineWidth: 0.04,
                    opacity: 0.4
                }
            )
        }
    },
    [schema.Action.UnpaintAction]: class UnpaintAction extends Action<schema.UnpaintAction> {
        apply(round: Round): void {
            round.map.paint[this.actionData.loc()] = 0
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const body = match.currentRound.bodies.getById(this.robotId)
            const pos = body.getInterpolatedCoords(match)

            const target = match.map.indexToLocation(this.actionData.loc())
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(pos.x, pos.y, match.currentRound.map.staticMap.dimension),
                renderUtils.getRenderCoords(target.x, target.y, match.currentRound.map.staticMap.dimension),
                {
                    color: body.team.color,
                    lineWidth: 0.04,
                    opacity: 0.4
                }
            )
        }
    },
    [schema.Action.MarkAction]: class MarkAction extends Action<schema.MarkAction> {
        apply(round: Round): void {
            const teamId = round.bodies.getById(this.robotId).team.id - 1
            const color = teamId * 2 + 1 + this.actionData.isSecondary()
            round.map.markers[teamId][this.actionData.loc()] = color
        }
    },
    [schema.Action.UnmarkAction]: class UnmarkAction extends Action<schema.UnmarkAction> {
        apply(round: Round): void {
            const teamId = round.bodies.getById(this.robotId).team.id - 1
            round.map.markers[teamId][this.actionData.loc()] = 0
        }
    },
    [schema.Action.MopAction]: class MopAction extends Action<schema.MopAction> {
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const map = match.currentRound.map
            const mainBody = match.currentRound.bodies.getById(this.robotId) // Main robot
            const mainPos = mainBody.getInterpolatedCoords(match)
            const mainCoords = renderUtils.getRenderCoords(mainPos.x, mainPos.y, map.dimension, true)

            ctx.strokeStyle = mainBody.team.color
            ctx.globalAlpha = 0.3
            ctx.fillStyle = mainBody.team.color
            ctx.beginPath()
            ctx.arc(mainCoords.x, mainCoords.y, 1.0, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1

            // Fetch targets
            const targetIds = [this.actionData.id0(), this.actionData.id1(), this.actionData.id2()]
            const targets = targetIds
                .filter((id) => id !== 0) // Filter out IDs equal to 0
                .map((id) => match.currentRound.bodies.getById(id)) // Map only non-zero IDs

            const factor = match.getInterpolationFactor()

            const sweepOffset = Math.sin((factor - 0.9) * Math.PI * 10) * 0.1 // Back-and-forth motion
            const rotationAngle = Math.sin((factor - 0.9) * Math.PI * 10) * 0.2 // Slight rotation

            // Loop through targets and draw visuals
            targets.forEach((target, index) => {
                if (!target) return

                const targetPos = target.getInterpolatedCoords(match)
                const baseCoords = renderUtils.getRenderCoords(targetPos.x, targetPos.y, map.dimension, false)

                // Apply the sweeping offset to the coordinates
                const coords = {
                    x: baseCoords.x + (index % 2 === 0 ? sweepOffset : -sweepOffset), // Alternate direction for different targets
                    y: baseCoords.y // Keep y constant for a horizontal sweep
                }

                // Draw line from main robot to the target
                ctx.globalAlpha = 0.5
                ctx.strokeStyle = 'white'
                ctx.lineWidth = 0.05
                ctx.beginPath()
                ctx.moveTo(mainCoords.x, mainCoords.y)
                ctx.lineTo(coords.x + 0.5, coords.y + 0.5)
                ctx.stroke()

                // Render image with rotation
                ctx.globalAlpha = 1.0
                ctx.shadowBlur = 4
                ctx.shadowColor = 'black'
                const transform = ctx.getTransform()
                ctx.translate(coords.x, coords.y) // Move context to target position
                ctx.rotate(rotationAngle) // Rotate context
                renderUtils.renderCenteredImageOrLoadingIndicator(
                    ctx,
                    getImageIfLoaded('icons/mop_64x64.png'),
                    { x: 0, y: 0 }, // Draw at the new origin
                    1
                )
                ctx.shadowBlur = 0
                ctx.shadowColor = ''
                ctx.setTransform(transform)
            })

            ctx.globalAlpha = 1
        }
    },
    [schema.Action.BuildAction]: class BuildAction extends Action<schema.BuildAction> {
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const map = match.currentRound.map
            const body = match.currentRound.bodies.getById(this.actionData.id())
            const coords = renderUtils.getRenderCoords(body.pos.x, body.pos.y, map.dimension, false)
            const factor = match.getInterpolationFactor()
            const isEndpoint = factor == 0 || factor == 1
            const size = isEndpoint ? 1 : Math.max(factor * 2, 0.3)
            const alpha = isEndpoint ? 1 : (factor < 0.5 ? factor : 1 - factor) * 2

            ctx.globalAlpha = alpha
            ctx.shadowBlur = 4
            ctx.shadowColor = 'black'
            renderUtils.renderCenteredImageOrLoadingIndicator(
                ctx,
                getImageIfLoaded('icons/hammer_64x64.png'),
                coords,
                size
            )
            ctx.shadowBlur = 0
            ctx.shadowColor = ''
            ctx.globalAlpha = 1
        }
    },
    [schema.Action.TransferAction]: class TransferAction extends Action<schema.TransferAction> {
        apply(round: Round): void {
            const amount = this.actionData.amount()

            if (amount === 0) {
                /* ! SCUFFED SPECIAL CASE: Resource pattern completed ! */
                return
            }

            const src = round.bodies.getById(this.robotId)
            const dst = round.bodies.getById(this.actionData.id())

            src.paint -= amount
            dst.paint += amount
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            if (this.actionData.amount() === 0) {
                /* ! SCUFFED SPECIAL CASE: Resource pattern completed ! */
                const centerIdx = this.actionData.id()
            } else {
                const srcBody = match.currentRound.bodies.getById(this.robotId)
                const dstBody = match.currentRound.bodies.getById(this.actionData.id())

                const from = srcBody.getInterpolatedCoords(match)
                const to = dstBody.getInterpolatedCoords(match)

                renderUtils.renderLine(
                    ctx,
                    renderUtils.getRenderCoords(from.x, from.y, match.currentRound.map.staticMap.dimension),
                    renderUtils.getRenderCoords(to.x, to.y, match.currentRound.map.staticMap.dimension),
                    {
                        color: '#11fc30',
                        lineWidth: 0.06,
                        opacity: 0.5,
                        renderArrow: true
                    }
                )
            }
        }
    },
    [schema.Action.MessageAction]: class MessageAction extends Action<schema.MessageAction> {
        apply(round: Round): void {}
    },
    [schema.Action.SpawnAction]: class SpawnAction extends Action<schema.SpawnAction> {
        apply(round: Round): void {
            round.bodies.spawnBodyFromAction(this.actionData)
        }
    },
    [schema.Action.DieAction]: class DieAction extends Action<schema.DieAction> {
        apply(round: Round): void {
            if (this.actionData.dieType() === schema.DieType.EXCEPTION) {
                // TODO: revisit this
                console.log(`Robot ${this.robotId} has died due to an exception`)
            }

            round.bodies.markBodyAsDead(this.actionData.id())
        }
    },
    [schema.Action.UpgradeAction]: class UpgradeAction extends Action<schema.UpgradeAction> {
        apply(round: Round): void {
            const towerId = this.actionData.id()
            const body = round.bodies.getById(towerId)
            body.level += 1
            body.hp = this.actionData.newHealth()
            body.maxHp = this.actionData.newMaxHealth()
            body.paint = this.actionData.newPaint()
            body.maxPaint = this.actionData.newMaxPaint()
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const map = match.currentRound.map
            const body = match.currentRound.bodies.getById(this.actionData.id())
            const coords = renderUtils.getRenderCoords(body.pos.x, body.pos.y, map.dimension, false)
            const factor = match.getInterpolationFactor()
            const isEndpoint = factor == 0 || factor == 1
            const size = isEndpoint ? 1 : Math.max(factor * 2, 0.3)
            const alpha = isEndpoint ? 1 : (factor < 0.5 ? factor : 1 - factor) * 2

            ctx.globalAlpha = alpha
            ctx.shadowBlur = 4
            ctx.shadowColor = 'black'
            renderUtils.renderCenteredImageOrLoadingIndicator(
                ctx,
                getImageIfLoaded('icons/gears_64x64.png'),
                coords,
                size
            )
            ctx.shadowBlur = 0
            ctx.shadowColor = ''
            ctx.globalAlpha = 1
        }
    },
    [schema.Action.IndicatorStringAction]: class IndicatorStringAction extends Action<schema.IndicatorStringAction> {
        apply(round: Round): void {
            const body = round.bodies.getById(this.robotId)
            const string = this.actionData.value()!
            body.indicatorString = string
        }
    },
    [schema.Action.IndicatorDotAction]: class IndicatorDotAction extends Action<schema.IndicatorDotAction> {
        apply(round: Round): void {
            const loc = this.actionData.loc()
            const vectorLoc = round.map.indexToLocation(loc)

            const body = round.bodies.getById(this.robotId)
            body.indicatorDots.push({
                location: vectorLoc,
                color: renderUtils.colorToHexString(this.actionData.colorHex())
            })
        }
    },
    [schema.Action.IndicatorLineAction]: class IndicatorLineAction extends Action<schema.IndicatorLineAction> {
        apply(round: Round): void {
            const starts = round.map.indexToLocation(this.actionData.startLoc())
            const ends = round.map.indexToLocation(this.actionData.endLoc())

            const body = round.bodies.getById(this.robotId)
            body.indicatorLines.push({
                start: starts,
                end: ends,
                color: renderUtils.colorToHexString(this.actionData.colorHex())
            })
        }
    }
}
