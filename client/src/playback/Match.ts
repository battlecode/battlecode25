import { schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Round from './Round'
import RoundStat from './RoundStat'
import { CurrentMap, StaticMap } from './Map'
import Actions from './Actions'
import Bodies from './Bodies'
import gameRunner from './GameRunner'

// Amount of rounds before a snapshot of the game state is saved for the next recalculation
const SNAPSHOT_EVERY = 50

// Amount of simulation steps before the round counter is progressed
const MAX_SIMULATION_STEPS = 50000

export default class Match {
    public currentRound: Round
    private readonly snapshots: Round[]
    public readonly stats: RoundStat[]
    private currentSimulationStep: number = 0
    private _playbackPerTurn: boolean = false
    private readonly deltas: schema.Round[]
    public maxRound: number = 1
    constructor(
        public readonly game: Game,
        public winner: Team | null,
        public winType: schema.WinType | null,
        public readonly map: StaticMap,
        initialBodies: Bodies
    ) {
        this.currentRound = new Round(this, 0, new CurrentMap(map), initialBodies, new Actions())
        this.snapshots = []
        this.stats = []
        this.deltas = []
    }

    get constants(): schema.GameplayConstants {
        return this.game.constants
    }

    get playbackPerTurn(): boolean {
        return this._playbackPerTurn
    }

    set playbackPerTurn(value: boolean) {
        this._playbackPerTurn = value
        this.currentSimulationStep = 0
        this.currentRound.jumpToTurn(value ? 0 : this.currentRound.turnsLength)
        gameRunner.signalMatchInternalChange()
    }

    /**
     * Creates a blank match for use in the map editor.
     */
    public static createBlank(game: Game, bodies: Bodies, map: StaticMap): Match {
        return new Match(game, game.teams[0], null, map, bodies)
    }

    /**
     * Creates a match from a map for loading into the map editor from an existing file.
     */
    public static fromMap(schemaMap: schema.GameMap, game: Game): Match {
        const map = StaticMap.fromSchema(schemaMap)
        const mapBodies = schemaMap.initialBodies()
        const bodies = new Bodies(game, mapBodies ?? undefined)
        return new Match(game, game.teams[0], null, map, bodies)
    }

    public static fromSchema(game: Game, header: schema.MatchHeader) {
        const mapData = header.map() ?? assert.fail('Map data not found in header')
        const map = StaticMap.fromSchema(mapData)

        const initialBodies = new Bodies(game, mapData.initialBodies() ?? undefined)

        const match = new Match(game, null, null, map, initialBodies)

        return match
    }

    /*
     * Add a new round to the match.
     */
    public addNewRound(round: schema.Round): void {
        // If the current round is the uninitialized starting round, apply the new round data
        if (this.currentRound.roundNumber === 0) {
            this.currentRound.startApplyNewRound(round)
            this.snapshots.push(this.currentRound.copy())
        }
        this.deltas.push(round)
        this.maxRound++
    }

    /*
     * Add the match footer to the match.
     */
    public addMatchFooter(footer: schema.MatchFooter): void {
        this.winner = this.game.teams[footer.winner() - 1]
        this.winType = footer.winType()
    }

    /**
     * Returns the normalized 0-1 value indicating the simulation progression for this round.
     */
    public getInterpolationFactor(): number {
        if (this.playbackPerTurn) return 1
        return Math.max(0, Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)) / MAX_SIMULATION_STEPS
    }

    /**
     * Change the simulation step to the current step + delta. If the step reaches the max simulation steps, the round counter is increased accordingly
     * Returns [whether the round was stepped, whether the turn was stepped]
     */
    public _stepSimulationByTime(deltaTime: number): [boolean, boolean] {
        assert(this.game.playable, "Can't step simulation when not playing")
        const currentRoundNumber = this.currentRound.roundNumber
        const currentTurnNumber = this.currentRound.nextTurnIndex

        this.currentSimulationStep += deltaTime * MAX_SIMULATION_STEPS
        if (this.playbackPerTurn) {
            if (this.currentSimulationStep >= MAX_SIMULATION_STEPS) {
                this._stepTurn(1)
                this.currentSimulationStep = 0
            } else if (this.currentSimulationStep < 0) {
                this._stepTurn(-1)
                this.currentSimulationStep = MAX_SIMULATION_STEPS - 1
            }
        } else {
            // ensure all turns are applied if we're in round playback
            this.currentRound.jumpToTurn(this.currentRound.turnsLength)
            this._updateSimulationRoundsByTime(deltaTime)
        }

        const roundStepped = currentRoundNumber != this.currentRound.roundNumber
        const turnStepped = currentTurnNumber != this.currentRound.nextTurnIndex || roundStepped
        return [roundStepped, turnStepped]
    }

    /**
     * Change the match's current round's turn to the current turn + delta.
     */
    public _stepTurn(turns: number): void {
        let targetTurn = this.currentRound.nextTurnIndex + turns
        if (this.currentRound.roundNumber === this.maxRound && turns > 0) {
            targetTurn = Math.min(targetTurn, this.currentRound.turnsLength)
        } else if (this.currentRound.roundNumber == 1 && turns < 0) {
            targetTurn = Math.max(0, targetTurn)
        } else if (targetTurn < 0) {
            this._stepRound(-1)
            targetTurn = this.currentRound.turnsLength - 1
        } else if (targetTurn >= this.currentRound.turnsLength) {
            this._stepRound(1)
            targetTurn = 0
        }

        this._jumpToTurn(targetTurn)
    }

    public _jumpToTurn(turn: number): void {
        if (!this.game.playable) return
        this.currentRound.jumpToTurn(turn)
    }

    private _updateSimulationRoundsByTime(deltaTime: number): void {
        if (this.currentRound.roundNumber == this.maxRound && deltaTime > 0) {
            this.currentSimulationStep = Math.min(this.currentSimulationStep, MAX_SIMULATION_STEPS)
        } else if (this.currentRound.roundNumber == 1 && deltaTime < 0) {
            this.currentSimulationStep = Math.max(0, this.currentSimulationStep)
        } else if (this.currentSimulationStep < 0) {
            this._stepRound(-1)
            this.currentSimulationStep = MAX_SIMULATION_STEPS - 1
        } else if (this.currentSimulationStep >= MAX_SIMULATION_STEPS) {
            this._stepRound(1)
            this.currentSimulationStep = 0
        }
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
     * Sets the current round to the first round.
     */
    public _jumpToStart(): void {
        this._jumpToRound(1)
    }

    /**
     * Sets the current round to the round at the given round number.
     */
    public _jumpToRound(roundNumber: number): void {
        if (!this.game.playable) return

        roundNumber = Math.max(1, Math.min(roundNumber, this.maxRound))
        if (roundNumber == this.currentRound.roundNumber) return

        const closestSnapshot = this.getClosestSnapshot(roundNumber)
        const updatingRound =
            this.currentRound.roundNumber <= roundNumber && this.currentRound.roundNumber >= closestSnapshot.roundNumber
                ? this.currentRound
                : closestSnapshot.copy()

        while (updatingRound.roundNumber < roundNumber) {
            updatingRound.jumpToTurn(updatingRound.turnsLength)
            updatingRound.startApplyNewRound(
                updatingRound.roundNumber < this.deltas.length ? this.deltas[updatingRound.roundNumber] : null
            )

            if (this.shouldSnapshot(updatingRound.roundNumber)) {
                // Snapshots should always be the round state just after starting (at turn 0)
                this.snapshots.push(updatingRound.copy())
            }
        }

        this.currentRound = updatingRound
        // ensure all turns are applied if we're in round playback
        // we have to do this here as well as in step simulation because rendering could occur before the sim is stepped
        if (!this.playbackPerTurn) this.currentRound.jumpToTurn(this.currentRound.turnsLength)
    }

    private getClosestSnapshot(roundNumber: number): Round {
        const snapshotIndex = Math.floor((roundNumber - 1) / SNAPSHOT_EVERY)
        const snapshot =
            snapshotIndex < this.snapshots.length
                ? this.snapshots[snapshotIndex]
                : this.snapshots[this.snapshots.length - 1]
        assert(snapshot, 'No viable snapshots found (there should always be a round 1 snapshot)')
        assert(snapshot.nextTurnIndex === 0, 'Snapshot should always be at turn 0')
        return snapshot
    }

    private shouldSnapshot(roundNumber: number): boolean {
        const lastSnapshotRoundNumber = this.snapshots[this.snapshots.length - 1]?.roundNumber || -1
        return roundNumber % SNAPSHOT_EVERY === 1 && roundNumber > lastSnapshotRoundNumber
    }

    public progressToRoundNumber(progress: number): number {
        return Math.floor(progress * (this.maxRound - 1)) + 1
    }

    public progressToTurnNumber(progress: number): number {
        return Math.floor(progress * this.currentRound.turnsLength)
    }
}
