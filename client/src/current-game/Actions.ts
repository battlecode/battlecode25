import Turn from './Turn'
import { schema } from 'battlecode-schema'
import assert from 'assert'
import * as renderUtils from '../util/render-util'
import { vectorAdd, vectorLength, vectorMultiply, vectorSub, vectorMultiplyInPlace, Vector } from '../util/vector'
import Match from './Match'
import { Body } from './Bodies'
import { ATTACK_COLOR, GRASS_COLOR, HEAL_COLOR, TEAM_COLORS, WATER_COLOR } from './Constants'

export default class Actions {
    actions: Action[] = []

    constructor() {}

    applyDelta(turn: Turn, delta: schema.Round): void {
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].duration--
            if (this.actions[i].duration == 0) {
                this.actions.splice(i, 1)
                i--
            }
        }

        if (delta.actionsLength() > 0) {
            for (let i = 0; i < delta.actionsLength(); i++) {
                const action = delta.actions(i) ?? assert.fail('actions not found in round')
                const robotID = delta.actionIds(i) ?? assert.fail('actionIDs not found in round')
                const target = delta.actionTargets(i) ?? assert.fail('actionTargets not found in round')
                const actionClass =
                    ACTION_DEFINITIONS[action] ?? assert.fail(`Action ${action} not found in ACTION_DEFINITIONS`)
                const newAction = new actionClass(robotID, target)
                this.actions.push(newAction)
                newAction.apply(turn)
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

export class Action {
    constructor(protected robotID: number, protected target: number, public duration: number = 1) {}

    /**
     * Applies this action to the turn provided. If stat is provided, it will be mutated to reflect the action as well
     *
     * @param turn the turn to apply this action to
     * @param stat if provided, this action will mutate the stat to reflect the action
     */
    apply(turn: Turn): void {}
    draw(match: Match, ctx: CanvasRenderingContext2D) {}
    copy(): Action {
        // creates a new object using this object's prototype and all its parameters. this is a shallow copy, override this if you need a deep copy
        return Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
    }
}

export abstract class ToFromAction extends Action {
    constructor(robotID: number, target: number) {
        super(robotID, target)
    }

    abstract drawToFrom(match: Match, ctx: CanvasRenderingContext2D, from: Vector, to: Vector, body: Body): void

    draw(match: Match, ctx: CanvasRenderingContext2D) {
        const body = match.currentTurn.bodies.getById(this.robotID) ?? assert.fail('Acting body not found')
        const interpStart = renderUtils.getInterpolatedCoordsFromBody(body, match.getInterpolationFactor())
        const targetBody = match.currentTurn.bodies.getById(this.target) ?? assert.fail('Action target not found')
        const interpEnd = renderUtils.getInterpolatedCoordsFromBody(targetBody, match.getInterpolationFactor())
        this.drawToFrom(match, ctx, interpStart, interpEnd, body)
    }
}

export const ACTION_DEFINITIONS: Record<schema.Action, typeof Action> = {
    [schema.Action.DIE_EXCEPTION]: class DieException extends Action {
        apply(turn: Turn): void {
            console.log(`Exception occured: robotID(${this.robotID}), target(${this.target}`)
        }
    },
    [schema.Action.ATTACK]: class Dig extends ToFromAction {
        apply(turn: Turn): void {
            // To dicuss
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
                renderUtils.getRenderCoords(from.x, from.y, match.currentTurn.map.staticMap.dimension),
                renderUtils.getRenderCoords(to.x, to.y, match.currentTurn.map.staticMap.dimension),
                { teamForOffset: body.team, color: body.team.color, lineWidth: 0.05, opacity: 0.3, renderArrow: false }
            )

            // Projectile animation
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(
                    projectileStart.x,
                    projectileStart.y,
                    match.currentTurn.map.staticMap.dimension
                ),
                renderUtils.getRenderCoords(
                    projectileEnd.x,
                    projectileEnd.y,
                    match.currentTurn.map.staticMap.dimension
                ),
                { teamForOffset: body.team, color: body.team.color, lineWidth: 0.05, opacity: 1.0, renderArrow: false }
            )
        }
    },
    [schema.Action.HEAL]: class Heal extends ToFromAction {
        apply(turn: Turn): void {
            // To dicuss
        }
        drawToFrom(match: Match, ctx: CanvasRenderingContext2D, from: Vector, to: Vector, body: Body): void {
            renderUtils.renderLine(
                ctx,
                renderUtils.getRenderCoords(from.x, from.y, match.currentTurn.map.staticMap.dimension),
                renderUtils.getRenderCoords(to.x, to.y, match.currentTurn.map.staticMap.dimension),
                {
                    color: HEAL_COLOR,
                    lineWidth: 0.05,
                    opacity: 0.5,
                    renderArrow: true
                }
            )
        }
    },
    [schema.Action.DIG]: class Dig extends Action {
        apply(turn: Turn): void {
            turn.map.water[this.target] = 1
        }
    },
    [schema.Action.FILL]: class Fill extends Action {
        apply(turn: Turn): void {
            turn.map.water[this.target] = 0
        }
    },
    [schema.Action.EXPLOSIVE_TRAP]: class ExplosiveTrap extends Action {
        apply(turn: Turn): void {
            // To dicuss
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = Math.sqrt(4)
            const map = match.currentTurn.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentTurn.bodies.getById(this.robotID)
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
    [schema.Action.WATER_TRAP]: class WaterTrap extends Action {
        apply(turn: Turn): void {}
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = 3
            const map = match.currentTurn.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentTurn.bodies.getById(this.robotID)
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
    [schema.Action.STUN_TRAP]: class StunTrap extends Action {
        apply(turn: Turn): void {
            // To dicuss
        }
        draw(match: Match, ctx: CanvasRenderingContext2D): void {
            const radius = Math.sqrt(13)
            const map = match.currentTurn.map
            const loc = map.indexToLocation(this.target)
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, map.dimension, true)

            // Get the trap color, assumes only opposite team can trigger
            const triggeredBot = match.currentTurn.bodies.getById(this.robotID)
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
    [schema.Action.PICKUP_FLAG]: class PickupFlag extends Action {
        apply(turn: Turn): void {
            const flagId = this.target
            const flagData = turn.map.flagData.get(flagId)!
            flagData.carrierId = this.robotID
            turn.bodies.getById(this.robotID).carryingFlagId = flagId
        }
    },
    [schema.Action.PLACE_FLAG]: class ResetFlag extends Action {
        apply(turn: Turn): void {
            const flagId = this.robotID
            const flagData = turn.map.flagData.get(flagId)!
            // Could be carrying or already placed
            if (flagData.carrierId) {
                turn.bodies.getById(flagData.carrierId).carryingFlagId = null
            }
            flagData.carrierId = null
            flagData.location = turn.map.indexToLocation(this.target)
        }
    },
    [schema.Action.CAPTURE_FLAG]: class CaptureFlag extends Action {
        apply(turn: Turn): void {
            const flagId = this.target
            const flagData = turn.map.flagData.get(flagId)!
            // Always carrying
            turn.bodies.getById(flagData.carrierId!).carryingFlagId = null
            turn.map.flagData.delete(flagId)
        }
    },
    [schema.Action.GLOBAL_UPGRADE]: class GlobalUpgrade extends Action {
        apply(turn: Turn): void {
            const team = turn.bodies.getById(this.robotID).team
            turn.stat.getTeamStat(team).globalUpgrades.push(this.target)
        }
    }
}
