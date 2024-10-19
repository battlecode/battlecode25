import { schema } from 'battlecode-schema'
import Actions from './Actions'
import Bodies from './Bodies'
import { Team } from './Game'
import { CurrentMap } from './Map'
import Match from './Match'
import TurnStat from './TurnStat'

export default class Turn {
    get teams(): Team[] {
        return this.match.game.teams
    }
    constructor(
        public readonly match: Match,
        public turnNumber: number = 0,
        public map: CurrentMap,
        public bodies: Bodies,
        public actions: Actions,
        public stat: TurnStat
    ) {}

    /**
     * Mutates this turn to reflect the given delta.
     */
    public applyDelta(delta: schema.Round, nextDelta: schema.Round | null): void {
        this.turnNumber += 1

        const firstTimeComputingStat = this.match.stats.length <= this.turnNumber
        if (firstTimeComputingStat)
            this.stat.completed = false // mark that stat should be computed by bodies and actions below
        else this.stat = this.match.stats[this.turnNumber].copy()

        /*
            The ordering here is important. Actions needs to be before map because it reads from the map's traps and 
            they would be removed if map was before it. Bodies needs to come before maps so that actions have access
            to spawned bodies
        */
        this.bodies.applyDelta(this, delta, nextDelta)
        this.actions.applyDelta(this, delta)
        this.map.applyDelta(delta)

        if (firstTimeComputingStat) {
            // finish computing stat and save to match
            this.stat.applyDelta(this, delta)
            this.match.stats[this.turnNumber] = this.stat.copy()
        }
    }

    public copy(): Turn {
        return new Turn(
            this.match,
            this.turnNumber,
            this.map.copy(),
            this.bodies.copy(),
            this.actions.copy(),
            this.stat.copy()
        )
    }

    public isStart() {
        return this.turnNumber === 0
    }

    public isEnd() {
        return this.turnNumber === this.match.maxTurn
    }
}
