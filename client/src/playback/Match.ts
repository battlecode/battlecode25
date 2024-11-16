import { schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Round from './Round'
import RoundStat from './RoundStat'
import { CurrentMap, StaticMap } from './Map'
import Actions from './Actions'
import Bodies from './Bodies'

// Amount of rounds before a snapshot of the game state is saved for the next recalculation
const SNAPSHOT_EVERY = 50

// Amount of simulation steps before the round counter is progressed
const MAX_SIMULATION_STEPS = 50000

export default class Match {
    public currentRound: Round
    private readonly snapshots: Round[]
    public readonly stats: RoundStat[]
    private currentSimulationStep: number = 0
    constructor(
        public readonly game: Game,
        private readonly deltas: schema.Round[],
        public maxRound: number,
        public winner: Team | null,
        public winType: schema.WinType | null,
        public readonly map: StaticMap,
        initialBodies: Bodies
    ) {
        this.verifyMap(initialBodies)

        this.currentRound = new Round(this, 0, new CurrentMap(map), initialBodies, new Actions())
        this.snapshots = [this.currentRound.copy()]
        this.stats = []
    }

    get constants(): schema.GameplayConstants {
        return this.game.constants
    }

    /**
     * Creates a blank match for use in the map editor.
     */
    public static createBlank(game: Game, bodies: Bodies, map: StaticMap): Match {
        return new Match(game, [], 0, game.teams[0], null, map, bodies)
    }

    /**
     * Creates a match from a map for loading into the map editor from an existing file.
     */
    public static fromMap(schemaMap: schema.GameMap, game: Game): Match {
        const map = StaticMap.fromSchema(schemaMap)
        const mapBodies = schemaMap.initialBodies()
        const bodies = new Bodies(game, mapBodies ?? undefined)
        return new Match(game, [], 0, game.teams[0], null, map, bodies)
    }

    public static fromSchema(
        game: Game,
        header: schema.MatchHeader,
        rounds: schema.Round[],
        footer?: schema.MatchFooter
    ) {
        const mapData = header.map() ?? assert.fail('Map data not found in header')
        const map = StaticMap.fromSchema(mapData)

        const initialBodies = new Bodies(game, mapData.initialBodies() ?? undefined)

        // header.maxRounds() is always 2000

        const deltas = rounds
        deltas.forEach((delta, i) =>
            assert(delta.roundId() === i + 1, `Wrong round ID: is ${delta.roundId()}, should be ${i}`)
        )

        const maxRound = deltas.length

        const match = new Match(game, deltas, maxRound, null, null, map, initialBodies)
        if (footer) {
            match.addMatchFooter(footer)
        }

        return match
    }

    /*
     * Add a new round to the match. Used for live match replaying.
     */
    public addNewRound(round: schema.Round): void {
        this.deltas.push(round)
        this.maxRound++
    }

    /*
     * Add the match footer to the match. Used for live match replaying.
     */
    public addMatchFooter(footer: schema.MatchFooter): void {
        this.winner = this.game.teams[footer.winner() - 1]
        this.winType = footer.winType()
    }

    /**
     * Returns the normalized 0-1 value indicating the simulation progression for this round.
     */
    public getInterpolationFactor(): number {
        return Math.max(0, Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)) / MAX_SIMULATION_STEPS
    }

    /**
     * Change the simulation step to the current step + delta. If the step reaches the max simulation steps, the round counter is increased accordingly
     * Returns whether the round was stepped
     */
    public _stepSimulation(deltaUpdates: number): boolean {
        assert(this.game.playable, "Can't step simulation when not playing")

        const delta = deltaUpdates * MAX_SIMULATION_STEPS
        this.currentSimulationStep += delta

        if (this.currentRound.roundNumber == this.maxRound && delta > 0) {
            this.currentSimulationStep = Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)
            return false
        }
        if (this.currentRound.roundNumber == 0 && delta < 0) {
            this.currentSimulationStep = Math.max(0, this.currentSimulationStep)
            return false
        }

        let roundChanged = false
        if (this.currentSimulationStep < 0) {
            this._stepRound(-1)
            this.currentSimulationStep = MAX_SIMULATION_STEPS - 1
            roundChanged = true
        } else if (this.currentSimulationStep >= MAX_SIMULATION_STEPS) {
            this._stepRound(1)
            this.currentSimulationStep = 0
            roundChanged = true
        } else {
            this.currentSimulationStep = (this.currentSimulationStep + MAX_SIMULATION_STEPS) % MAX_SIMULATION_STEPS
        }

        return roundChanged
    }

    /**
     * Clear any excess simulation steps and round it to the nearest round
     */
    public _roundSimulation(): void {
        this.currentSimulationStep = 0
    }

    /**
     * Change the match's current round to the current round + delta.
     */
    public _stepRound(delta: number): void {
        this._jumpToRound(this.currentRound.roundNumber + delta)
    }

    /**
     * Sets the current round to the last round.
     */
    public _jumpToEnd(): void {
        this._jumpToRound(this.maxRound)
    }

    /**
     * Sets the current round to the round at the given round number.
     */
    public _jumpToRound(roundNumber: number): void {
        if (!this.game.playable) return

        roundNumber = Math.max(0, Math.min(roundNumber, this.deltas.length))
        if (roundNumber == this.currentRound.roundNumber) return

        // If we are stepping backwards, we must always recompute from the latest checkpoint
        const reversed = roundNumber < this.currentRound.roundNumber

        // If the new round is closer to a snapshot than from the current round, compute from the snapshot
        const snapshotIndex = Math.floor(roundNumber / SNAPSHOT_EVERY)
        const closeSnapshot =
            snapshotIndex > Math.floor(this.currentRound.roundNumber / SNAPSHOT_EVERY) &&
            snapshotIndex < this.snapshots.length

        const computeFromSnapshot = reversed || closeSnapshot
        let updatingRound = this.currentRound
        if (computeFromSnapshot) updatingRound = this.snapshots[snapshotIndex].copy()

        while (updatingRound.roundNumber < roundNumber) {
            const delta = this.deltas[updatingRound.roundNumber]
            const nextDelta =
                updatingRound.roundNumber < this.deltas.length - 1 ? this.deltas[updatingRound.roundNumber + 1] : null
            updatingRound.applyDelta(delta, nextDelta)

            if (
                updatingRound.roundNumber % SNAPSHOT_EVERY === 0 &&
                this.snapshots.length < updatingRound.roundNumber / SNAPSHOT_EVERY + 1
            ) {
                this.snapshots.push(updatingRound.copy())
            }
        }

        this.currentRound = updatingRound
    }

    private verifyMap(initialBodies: Bodies): void {
        for (let i = 0; i < this.map.width * this.map.height; i++) {
            if (this.map.walls[i]) {
                for (const body of initialBodies.bodies.values()) {
                    if (body.pos.x == i % this.map.width && body.pos.y == Math.floor(i / this.map.width)) {
                        assert.fail(`Body at (${body.pos.x}, ${body.pos.y}) is on top of a wall`)
                    }
                }
            }
        }
    }
}
