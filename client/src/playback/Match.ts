import { schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Turn from './Turn'
import TurnStat from './TurnStat'
import { CurrentMap, StaticMap } from './Map'
import Actions from './Actions'
import Bodies from './Bodies'

// Amount of turns before a snapshot of the game state is saved for the next recalculation
const SNAPSHOT_EVERY = 50

// Amount of simulation steps before the turn counter is progressed
const MAX_SIMULATION_STEPS = 50000

export default class Match {
    public currentTurn: Turn
    private readonly snapshots: Turn[]
    public readonly stats: TurnStat[]
    private currentSimulationStep: number = 0
    get constants(): schema.GameplayConstants {
        return this.game.constants
    }
    constructor(
        public readonly game: Game,
        private readonly deltas: schema.Round[],
        public maxTurn: number,
        public winner: Team | null,
        public winType: schema.WinType | null,
        public readonly map: StaticMap,
        firstBodies: Bodies,
        firstStats: TurnStat
    ) {
        this.currentTurn = new Turn(this, 0, new CurrentMap(map), firstBodies, new Actions(), firstStats)
        this.snapshots = [this.currentTurn.copy()]
        this.stats = [this.snapshots[0].stat]
    }

    /**
     * Creates a blank match for use in the map editor.
     */
    public static createBlank(game: Game, bodies: Bodies, map: StaticMap): Match {
        const firstStats = new TurnStat(game)
        return new Match(game, [], 0, game.teams[0], schema.WinType.RESIGNATION, map, bodies, firstStats)
    }

    /**
     * Creates a match from a map for loading into the map editor from an existing file.
     */
    public static fromMap(schema_map: schema.GameMap, game: Game, map: StaticMap): Match {
        const firstStats = new TurnStat(game)
        const mapBodies = schema_map.bodies() ?? assert.fail('Initial bodies not found in header')
        const bodies = new Bodies(game, mapBodies, firstStats, map)
        return new Match(game, [], 0, game.teams[0], schema.WinType.RESIGNATION, map, bodies, firstStats)
    }

    public static fromSchema(
        game: Game,
        header: schema.MatchHeader,
        turns: schema.Round[],
        footer?: schema.MatchFooter
    ) {
        const mapData = header.map() ?? assert.fail('Map data not found in header')
        const map = StaticMap.fromSchema(mapData)

        const firstStats = new TurnStat(game)
        const firstBodies = new Bodies(
            game,
            mapData.bodies() ?? assert.fail('Initial bodies not found in header'),
            firstStats
        )

        // header.maxRounds() is always 2000

        const deltas = turns
        deltas.forEach((delta, i) =>
            assert(delta.roundId() === i + 1, `Wrong turn ID: is ${delta.roundId()}, should be ${i}`)
        )

        const maxTurn = deltas.length

        const match = new Match(game, deltas, maxTurn, null, null, map, firstBodies, firstStats)
        if (footer) match.addMatchFooter(footer)

        return match
    }

    /*
     * Add a new turn to the match. Used for live match replaying.
     */
    public addNewTurn(round: schema.Round): void {
        this.deltas.push(round)
        this.maxTurn++
    }

    /*
     * Add the match footer to the match. Used for live match replaying.
     */
    public addMatchFooter(footer: schema.MatchFooter): void {
        this.winner = this.game.teams[footer.winner() - 1]
        this.winType = footer.winType()
    }

    /**
     * Returns the normalized 0-1 value indicating the simulation progression for this turn.
     */
    public getInterpolationFactor(): number {
        return Math.max(0, Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)) / MAX_SIMULATION_STEPS
    }

    /**
     * Change the simulation step to the current step + delta. If the step reaches the max simulation steps, the turn counter is increased accordingly
     * Returns whether the turn was stepped
     */
    public _stepSimulation(deltaUpdates: number): boolean {
        assert(this.game.playable, "Can't step simulation when not playing")

        const delta = deltaUpdates * MAX_SIMULATION_STEPS
        this.currentSimulationStep += delta

        if (this.currentTurn.turnNumber == this.maxTurn && delta > 0) {
            this.currentSimulationStep = Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)
            return false
        }
        if (this.currentTurn.turnNumber == 0 && delta < 0) {
            this.currentSimulationStep = Math.max(0, this.currentSimulationStep)
            return false
        }

        let turnChanged = false
        if (this.currentSimulationStep < 0) {
            this._stepTurn(-1)
            this.currentSimulationStep = MAX_SIMULATION_STEPS - 1
            turnChanged = true
        } else if (this.currentSimulationStep >= MAX_SIMULATION_STEPS) {
            this._stepTurn(1)
            this.currentSimulationStep = 0
            turnChanged = true
        } else {
            this.currentSimulationStep = (this.currentSimulationStep + MAX_SIMULATION_STEPS) % MAX_SIMULATION_STEPS
        }

        return turnChanged
    }

    /**
     * Clear any excess simulation steps and round it to the nearest turn
     */
    public _roundSimulation(): void {
        this.currentSimulationStep = 0
    }

    /**
     * Change the rounds current turn to the current turn + delta.
     */
    public _stepTurn(delta: number): void {
        this._jumpToTurn(this.currentTurn.turnNumber + delta)
    }

    /**
     * Sets the current turn to the last turn.
     */
    public _jumpToEnd(): void {
        this._jumpToTurn(this.maxTurn)
    }

    /**
     * Sets the current turn to the turn at the given turn number.
     */
    public _jumpToTurn(turnNumber: number): void {
        if (!this.game.playable) return

        turnNumber = Math.max(0, Math.min(turnNumber, this.deltas.length))
        if (turnNumber == this.currentTurn.turnNumber) return

        // If we are stepping backwards, we must always recompute from the latest checkpoint
        const reversed = turnNumber < this.currentTurn.turnNumber

        // If the new turn is closer to a snapshot than from the current turn, compute from the snapshot
        const snapshotIndex = Math.floor(turnNumber / SNAPSHOT_EVERY)
        const closeSnapshot =
            snapshotIndex > Math.floor(this.currentTurn.turnNumber / SNAPSHOT_EVERY) &&
            snapshotIndex < this.snapshots.length

        const computeFromSnapshot = reversed || closeSnapshot
        let updatingTurn = this.currentTurn
        if (computeFromSnapshot) updatingTurn = this.snapshots[snapshotIndex].copy()

        while (updatingTurn.turnNumber < turnNumber) {
            const delta = this.deltas[updatingTurn.turnNumber]
            const nextDelta =
                updatingTurn.turnNumber < this.deltas.length - 1 ? this.deltas[updatingTurn.turnNumber + 1] : null
            updatingTurn.applyDelta(delta, nextDelta)

            if (
                updatingTurn.turnNumber % SNAPSHOT_EVERY === 0 &&
                this.snapshots.length < updatingTurn.turnNumber / SNAPSHOT_EVERY + 1
            ) {
                this.snapshots.push(updatingTurn.copy())
            }
        }

        this.currentTurn = updatingTurn
    }
}
