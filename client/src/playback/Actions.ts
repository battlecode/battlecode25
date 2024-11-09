import Round from './Round'
import { schema } from 'battlecode-schema'
import { unionToAction } from 'battlecode-schema/js/battlecode/schema/action'
import assert from 'assert'
import * as renderUtils from '../util/RenderUtil'
import { vectorAdd, vectorLength, vectorMultiply, vectorSub, vectorMultiplyInPlace, Vector } from './Vector'
import Match from './Match'
import { Body } from './Bodies'
import { ATTACK_COLOR, GRASS_COLOR, HEAL_COLOR, TEAM_COLORS, WATER_COLOR } from '../constants'
import { AttackAction } from 'battlecode-schema/js/battlecode/schema'

type ActionUnion = Exclude<ReturnType<typeof unionToAction>, null>

export default class Actions {
    actions: Action<ActionUnion>[] = []

    constructor() {}

    applyTurn(round: Round, turn: schema.Turn): void {
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].duration--
            if (this.actions[i].duration == 0) {
                this.actions.splice(i, 1)
                i--
            }
        }

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

//export abstract class ToFromAction extends Action {
//    constructor(action: ActionUnion) {
//        super(action)
//    }

//    abstract drawToFrom(match: Match, ctx: CanvasRenderingContext2D, from: Vector, to: Vector, body: Body): void

//    draw(match: Match, ctx: CanvasRenderingContext2D) {
//        const body = match.currentRound.bodies.getById(this.robotID) ?? assert.fail('Acting body not found')
//        const interpStart = renderUtils.getInterpolatedCoordsFromBody(body, match.getInterpolationFactor())
//        const targetBody = match.currentRound.bodies.getById(this.target) ?? assert.fail('Action target not found')
//        const interpEnd = renderUtils.getInterpolatedCoordsFromBody(targetBody, match.getInterpolationFactor())
//        this.drawToFrom(match, ctx, interpStart, interpEnd, body)
//    }
//}

export const ACTION_DEFINITIONS: Record<schema.Action, typeof Action<ActionUnion>> = {
    [schema.Action.NONE]: class NONE extends Action<ActionUnion> {
        apply(round: Round): void {
            throw new Error("yoo what !?! this shouldn't happen! :( (NONE action)");
        }
    },
    //old DieException
    [schema.Action.DamageAction]: class DamageAction extends Action<schema.DamageAction> {
        apply(round: Round): void {
            //console.log(`Exception occured: robotID(${this.robotID}), target(${this.target}`)
        }
    },
    [schema.Action.AttackAction]: class AttackAction extends Action<schema.AttackAction> {
        apply(round: Round): void {
            // To discuss
        }
        drawToFrom(match: Match, ctx: CanvasRenderingContext2D, from: Vector, to: Vector, body: Body): void {
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
                { teamForOffset: body.team, color: body.team.color, lineWidth: 0.05, opacity: 0.3, renderArrow: false }
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
                { teamForOffset: body.team, color: body.team.color, lineWidth: 0.05, opacity: 1.0, renderArrow: false }
            )
        }
    },
    //[schema.Action.HEAL]: class Heal extends ToFromAction {
    //    apply(round: Round): void {
    //        // To discuss
    //    }
    //    drawToFrom(match: Match, ctx: CanvasRenderingContext2D, from: Vector, to: Vector, body: Body): void {
    //        renderUtils.renderLine(
    //            ctx,
    //            renderUtils.getRenderCoords(from.x, from.y, match.currentRound.map.staticMap.dimension),
    //            renderUtils.getRenderCoords(to.x, to.y, match.currentRound.map.staticMap.dimension),
    //            {
    //                color: HEAL_COLOR,
    //                lineWidth: 0.05,
    //                opacity: 0.5,
    //                renderArrow: true
    //            }
    //        )
    //    }
    //},
    [schema.Action.UnpaintAction]: class UnpaintAction extends Action<schema.UnpaintAction> {
        apply(round: Round): void {
            round.map.paint[this.target] = 0
        }
    },
    [schema.Action.PaintAction]: class PaintAction extends Action<schema.PaintAction> {
        apply(round: Round): void {
            round.map.paint[this.target] = round.bodies.getById(this.robotId).team.id
        }
    },
    [schema.Action.MopAction]: class MopAction extends Action<schema.MopAction> {
        apply(round: Round): void {
            // To discuss
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = Math.sqrt(4)
            const map = match.currentRound.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentRound.bodies.getById(this.robotId)
            ctx.strokeStyle = TEAM_COLORS[1 - (triggeredBot.team.id - 1)]

            ctx.globalAlpha = 0.5
            ctx.fillStyle = ATTACK_COLOR
            ctx.beginPath()
            ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    },
    //!! change
    [schema.Action.BuildAction]: class BuildAction extends Action<schema.BuildAction> {
        apply(round: Round): void {}
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = 3
            const map = match.currentRound.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentRound.bodies.getById(this.robotId)
            ctx.strokeStyle = TEAM_COLORS[1 - (triggeredBot.team.id - 1)]

            ctx.globalAlpha = 0.5
            ctx.fillStyle = WATER_COLOR
            ctx.beginPath()
            ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    },
    [schema.Action.TransferAction]: class TransferAction extends Action<schema.TransferAction> {
        apply(round: Round): void {
            // To dicuss
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = Math.sqrt(13)
            const map = match.currentRound.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentRound.bodies.getById(this.robotId)
            ctx.strokeStyle = TEAM_COLORS[1 - (triggeredBot.team.id - 1)]

            ctx.globalAlpha = 0.5
            ctx.fillStyle = 'black'
            ctx.beginPath()
            ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    },
    [schema.Action.MessageAction]: class MessageAction extends Action<schema.MessageAction> {
        apply(round: Round): void {
            const flagId = this.target
            const flagData = round.map.flagData.get(flagId)!
            flagData.carrierId = this.robotId
            round.bodies.getById(this.robotId).carryingFlagId = flagId
        }
    },
    [schema.Action.SpawnAction]: class SpawnAction extends Action<schema.SpawnAction> {
        apply(round: Round): void {
            const flagId = this.robotId
            const flagData = round.map.flagData.get(flagId)!
            // Could be carrying or already placed
            if (flagData.carrierId) {
                round.bodies.getById(flagData.carrierId).carryingFlagId = null
            }
            flagData.carrierId = null
            flagData.location = round.map.indexToLocation(this.target)
        }
    },
    [schema.Action.UpgradeAction]: class UpgradeAction extends Action<schema.UpgradeAction> {
        apply(round: Round): void {
            const team = round.bodies.getById(this.robotId).team
            round.stat.getTeamStat(team).globalUpgrades.push(this.target)
        }
    },
    [schema.Action.IndicatorStringAction]: class IndicatorStringAction extends Action<schema.IndicatorStringAction> {
        apply(round: Round): void {
            
        }
    },
    [schema.Action.IndicatorDotAction]: class IndicatorDotAction extends Action<schema.IndicatorDotAction> {
        apply(round: Round): void {
            
        }
    },
    [schema.Action.IndicatorLineAction]: class IndicatorLineAction extends Action<schema.IndicatorLineAction> {
        apply(round: Round): void {
            
        }
    }
}
