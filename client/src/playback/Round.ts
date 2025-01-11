import { schema } from 'battlecode-schema'
import Actions from './Actions'
import Bodies from './Bodies'
import { Team } from './Game'
import { CurrentMap } from './Map'
import Match from './Match'
import RoundStat from './RoundStat'
import assert from 'assert'

export default class Round {
    public turnNumber: number = 0
    public lastSteppedRobotId: number | undefined = undefined
    public isTransient: boolean = false
    private initialRoundState: Round | null = null

    constructor(
        public readonly match: Match,
        public roundNumber: number = 0,
        public map: CurrentMap,
        public bodies: Bodies,
        public actions: Actions,
        private currentDelta: schema.Round | null = null
    ) {
        // Populate initial stat for round 0 (initial state)
        if (roundNumber === 0) {
            this.stat.applyRoundDelta(this, null)
        }
    }

    get teams(): Team[] {
        return this.match.game.teams
    }

    get stat(): RoundStat {
        const stat = this.match.stats[this.roundNumber]
        if (stat) return stat

        const newStat = new RoundStat(this.match.game)
        this.match.stats[this.roundNumber] = newStat
        return newStat
    }

    get turnsLength(): number {
        return this.currentDelta?.turnsLength() ?? 0
    }

    /**
     * Mutates the round to start applying a new round.
     * If delta is null, this is the final round of the game, since the final round
     * is only used to show the state of the game after the previous round ended and does not have a delta.
     */
    public startApplyNewRound(delta: schema.Round | null): void {
        assert(
            this.turnNumber === this.turnsLength,
            `Cannot start a new round without completing the previous one, round ${this.roundNumber}`
        )

        this.bodies.processRoundEnd(this.currentDelta)

        this.roundNumber += 1

        this.stat.applyRoundDelta(this, this.currentDelta)

        this.initialRoundState = null
        this.turnNumber = 0
        this.currentDelta = delta
    }

    /**
     *  Jumps to a specific turn in the round.
     */
    public jumpToTurn(turnNumber: number): void {
        if (!this.currentDelta) return // Final round does not have a delta, so there is nothing to jump to

        if (turnNumber < this.turnNumber) {
            assert(this.initialRoundState, 'Cannot reset to start of a round without first stepping')
            this.bodies = this.initialRoundState.bodies.copy()
            this.actions = this.initialRoundState.actions.copy()
            this.map = this.initialRoundState.map.copy()
            this.turnNumber = 0
        }

        while (this.turnNumber < turnNumber) {
            this.stepTurn()
        }
    }

    /**
     *  Jumps to a specific robot's turn in the round, if it exists.
     */
    public jumpToRobotTurn(robotId: number): void {
        if (!this.currentDelta) return // Final round does not have a delta, so there is nothing to jump to

        for (let i = 0; i < this.currentDelta.turnsLength(); i++) {
            const turn = this.currentDelta.turns(i)!
            if (turn.robotId() === robotId) {
                this.jumpToTurn(i + 1)
                return
            }
        }
    }

    /**
     * Step the current turn within the current delta.
     */
    private stepTurn(): void {
        assert(this.turnNumber < this.turnsLength, 'Cannot step a round that is at the end')

        const turn = this.currentDelta!.turns(this.turnNumber)
        assert(turn, 'Turn not found to step to')

        if (!this.initialRoundState && !this.isTransient) {
            // Store the initial round state for resetting only after stepping, that way snapshots dont need to store it, halving memory usage
            assert(this.turnNumber === 0, 'Initial round state should only be set at turn 0')
            this.initialRoundState = this.copy()
        }

        // Tick actions and remove died bots once we pass the first turn so that
        // round n shows the state of actions at the end of round n-1, until we
        // start progressing
        if (this.turnNumber === 0) {
            this.actions.tickLifetimes()
            this.bodies.clearDiedBodies()
        }

        this.bodies.clearIndicators(turn.robotId())

        this.map.applyTurnDelta(turn)
        this.actions.applyTurnDelta(this, turn)
        this.bodies.applyTurnDelta(this, turn)

        this.turnNumber += 1

        this.lastSteppedRobotId = turn.robotId()
    }

    public copy(): Round {
        return new Round(
            this.match,
            this.roundNumber,
            this.map.copy(),
            this.bodies.copy(),
            this.actions.copy(),
            this.currentDelta // snapshots store the delta for their round, since they are stored at turn 0 and need to be able to apply their turns
        )
    }

    public isStart() {
        return this.roundNumber === 0
    }

    public isEnd() {
        return this.roundNumber === this.match.maxRound
    }
}
