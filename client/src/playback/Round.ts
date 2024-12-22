import { schema } from 'battlecode-schema'
import Actions from './Actions'
import Bodies from './Bodies'
import { Team } from './Game'
import { CurrentMap } from './Map'
import Match from './Match'
import RoundStat from './RoundStat'

export default class Round {
    constructor(
        public readonly match: Match,
        public roundNumber: number = 0,
        public map: CurrentMap,
        public bodies: Bodies,
        public actions: Actions
    ) {}

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

    /**
     * Mutates this round to reflect the given delta.
     */
    public applyDelta(delta: schema.Round, nextDelta: schema.Round | null): void {
        this.roundNumber += 1

        // Prepare the bodies to receive the set of turn deltas
        this.bodies.prepareForNextRound()

        // Apply the round delta to the map
        this.map.applyDelta(delta)

        // Apply all robot turns in order
        for (let i = 0; i < delta.turnsLength(); i++) {
            const turn = delta.turns(i)!

            // Need to apply actions before bodies because of spawn action
            this.actions.applyTurn(this, turn)
            this.bodies.applyTurn(this, turn)
        }

        // Update robot next positions for interpolation based on the next delta
        if (nextDelta) {
            this.updateNextPositions(nextDelta)
        }

        // Flag all died robots as so
        // TODO: revisit?
        this.bodies.processDiedIds(delta)

        // Update any statistics for this round
        this.stat.applyDelta(this, delta)
    }

    public updateNextPositions(nextDelta: schema.Round): void {
        this.bodies.updateNextPositions(nextDelta)
    }

    public copy(): Round {
        return new Round(this.match, this.roundNumber, this.map.copy(), this.bodies.copy(), this.actions.copy())
    }

    public isStart() {
        return this.roundNumber === 0
    }

    public isEnd() {
        return this.roundNumber === this.match.maxRound
    }
}
