import { schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Round from './Round'
import RoundStat from './RoundStat'
import { CurrentMap, StaticMap } from './Map'
import Actions from './Actions'
import Bodies from './Bodies'
import * as Profiler from './Profiler'
import * as Timeline from './Timeline'

// Amount of rounds before a snapshot of the game state is saved for the next recalculation
const SNAPSHOT_EVERY = 40

// Amount of simulation steps before the round counter is progressed
const MAX_SIMULATION_STEPS = 50000

export default class Match {
    public maxRound: number = 1
    public currentRound: Round
    public readonly profilerFiles: Profiler.ParsedProfilerFile[] = []
    public readonly timelineMarkers: Timeline.TimelineMarker[] = []
    public readonly stats: RoundStat[] = []
    private readonly deltas: schema.Round[] = []
    private readonly snapshots: Round[] = []
    private _currentSimulationStep: number = 0
    private _playbackPerTurn: boolean = false

    constructor(
        public readonly game: Game,
        public winner: Team | null,
        public winType: schema.WinType | null,
        public readonly map: StaticMap,
        initialBodies: Bodies
    ) {
        this.currentRound = new Round(this, 0, new CurrentMap(map), initialBodies, new Actions())
    }

    get constants(): schema.GameplayConstants {
        return this.game.constants
    }

    get playbackPerTurn(): boolean {
        return this._playbackPerTurn
    }

    set playbackPerTurn(value: boolean) {
        this._playbackPerTurn = value
        this._currentSimulationStep = 0
        this.currentRound.jumpToTurn(0)
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
        this.addTimelineMarkers(footer)
        this.addProfilerFiles(footer)
    }

    /*
     * Parse timeline markers from the match footer and store them
     */
    public addTimelineMarkers(footer: schema.MatchFooter): void {
        for (let i = 0; i < footer.timelineMarkersLength(); i++) {
            const marker = footer.timelineMarkers(i)!

            // Add one to round so that the visualizer properly shows the action completed state
            this.timelineMarkers.push({
                round: marker.round() + 1,
                team: marker.team(),
                colorHex: marker.colorHex(),
                label: marker.label() ?? 'Unknown'
            })
        }
    }

    /*
     * Parse profiler files from the match footer and store them
     */
    public addProfilerFiles(footer: schema.MatchFooter): void {
        for (let i = 0, iMax = footer.profilerFilesLength(); i < iMax; i++) {
            const file = footer.profilerFiles(i) ?? assert.fail('Profiler file was null')
            const profilerFile: Profiler.ParsedProfilerFile = { frames: [], profiles: [] }
            for (let j = 0, jMax = file.framesLength(); j < jMax; j++) {
                profilerFile.frames.push({ name: file.frames(j) })
            }
            for (let j = 0, jMax = file.profilesLength(); j < jMax; j++) {
                const profile = file.profiles(j) ?? assert.fail('Profiler profile was null')
                const events: (Profiler.OpenFrameEvent | Profiler.CloseFrameEvent)[] = []
                let startValue: number | undefined = undefined
                let endValue: number | undefined = undefined
                for (let k = 0, kMax = profile.eventsLength(); k < kMax; k++) {
                    const event = profile.events(k) ?? assert.fail('Profiler event was null')
                    events.push({
                        type: event.isOpen() ? Profiler.EventType.OPEN_FRAME : Profiler.EventType.CLOSE_FRAME,
                        at: event.at(),
                        frame: event.frame()
                    })
                    startValue = Math.min(startValue ?? event.at(), event.at())
                    endValue = Math.max(endValue ?? event.at(), event.at())
                }

                const profileName = profile.name() ?? assert.fail('Profiler name was null')
                const profileId = Number(profileName.substring(1))
                profilerFile.profiles.push({
                    type: Profiler.ProfileType.EVENTED,
                    id: profileId,
                    name: profileName,
                    events,
                    startValue: startValue! - 1,
                    endValue: endValue! + 1,
                    unit: 'none'
                })
            }
            this.profilerFiles.push(profilerFile)

            // Sort by robot id
            profilerFile.profiles.sort((a, b) => a.id - b.id)
        }
    }

    /**
     * Returns the normalized 0-1 value indicating the simulation progression for this round.
     */
    public getInterpolationFactor(): number {
        if (this.playbackPerTurn) return 1
        return Math.max(0, Math.min(this._currentSimulationStep, MAX_SIMULATION_STEPS)) / MAX_SIMULATION_STEPS
    }

    /**
     * Change the simulation step to the current step + delta. If the step reaches the max simulation steps, the round counter is increased accordingly
     * Returns [whether the round was stepped, whether the turn was stepped]
     */
    public _stepSimulationByTime(deltaTime: number): [boolean, boolean] {
        assert(this.game.playable, "Can't step simulation when not playing")
        const currentRoundNumber = this.currentRound.roundNumber
        const currentTurnNumber = this.currentRound.turnNumber

        this._currentSimulationStep += deltaTime * MAX_SIMULATION_STEPS

        if (this.playbackPerTurn) {
            // This works because of the way floor works
            const deltaTurns = Math.floor(this._currentSimulationStep / MAX_SIMULATION_STEPS)
            if (this._currentSimulationStep >= MAX_SIMULATION_STEPS) {
                this._stepTurn(deltaTurns)
                this._currentSimulationStep = 0
            } else if (this._currentSimulationStep < 0) {
                this._stepTurn(deltaTurns)
                this._currentSimulationStep = MAX_SIMULATION_STEPS - 1
            }
        } else {
            // When we are simulating, perform all turns so that the robots
            // will interpolate between their current state and the applied state
            this.currentRound.jumpToTurn(this.currentRound.turnsLength)
            this._updateSimulationRoundsByTime(deltaTime)
        }

        const roundStepped = currentRoundNumber != this.currentRound.roundNumber
        const turnStepped = currentTurnNumber != this.currentRound.turnNumber || roundStepped
        return [roundStepped, turnStepped]
    }

    /**
     * Change the match's current round's turn to the current turn + delta.
     */
    public _stepTurn(turns: number): void {
        let targetTurn = this.currentRound.turnNumber + turns
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

    /**
     * Jump to a turn within the current round's turns.
     */
    public _jumpToTurn(turn: number): void {
        if (!this.game.playable) return

        this._roundSimulation()

        this.currentRound.jumpToTurn(turn)
    }

    /**
     * Jump to the turn of a specific robot within the current round's turns, if it exists.
     */
    public _jumpToRobotTurn(robotId: number): void {
        if (!this.game.playable) return

        this._roundSimulation()

        this.currentRound.jumpToRobotTurn(robotId)
    }

    private _updateSimulationRoundsByTime(deltaTime: number): void {
        // This works because of the way floor works
        const deltaRounds = Math.floor(this._currentSimulationStep / MAX_SIMULATION_STEPS)
        if (this.currentRound.roundNumber == this.maxRound && deltaTime > 0) {
            // If we are at the end, round the simulation to the max value
            this._currentSimulationStep = Math.min(this._currentSimulationStep, MAX_SIMULATION_STEPS)
        } else if (this.currentRound.roundNumber == 1 && deltaTime < 0) {
            // If we are at the start, round the simulation to zero
            this._currentSimulationStep = Math.max(0, this._currentSimulationStep)
        } else if (this._currentSimulationStep < 0) {
            // If we are going in reverse, step the rounds back by one. Also,
            // apply all turns for that round so that the transition is smooth
            this._stepRound(deltaRounds)
            this.currentRound.jumpToTurn(this.currentRound.turnsLength)
            this._currentSimulationStep = MAX_SIMULATION_STEPS - 1
        } else if (this._currentSimulationStep >= MAX_SIMULATION_STEPS) {
            // If we are going forward, simply step the turn
            this._stepRound(deltaRounds)
        }
    }

    /**
     * Clear any excess simulation steps and round it to the nearest round
     */
    public _roundSimulation(): void {
        // If we are in round playback mode, we need to reset back to the start
        // state because simulating has prematurely applied these turns
        if (!this.playbackPerTurn) {
            this.currentRound.jumpToTurn(0)
        }

        this._currentSimulationStep = 0
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
        if (this.snapshots.length === 0) return

        this._roundSimulation()

        // Determine the maximum round we are allowed to jump to. If the game is
        // incomplete (still being updated with rounds), prevent jumping to the last
        // round to prevent issues (TODO: investigate why, but this seems to fix it)
        const maxRound = this.maxRound - (this.game.complete ? 0 : 1)

        roundNumber = Math.max(1, Math.min(roundNumber, maxRound))
        if (roundNumber == this.currentRound.roundNumber) return

        // Select the closest snapshot round, or mutate the current round if we can
        // to avoid copying
        const closestSnapshot = this.getClosestSnapshot(roundNumber)
        const updatingRound =
            this.currentRound.roundNumber <= roundNumber && this.currentRound.roundNumber >= closestSnapshot.roundNumber
                ? this.currentRound
                : closestSnapshot.copy()

        // While we are jumping (forward) to a round, mark the intermediate rounds
        // as transient. This way, we do not store initial state for these rounds that
        // we are simply passing through, as they will never have any sort of backward
        // turn stepping.
        updatingRound.isTransient = true

        while (updatingRound.roundNumber < roundNumber) {
            // Fully apply the previous round by applying each turn sequentially
            updatingRound.jumpToTurn(updatingRound.turnsLength)

            // Update the round with the delta that will be applied next
            updatingRound.startApplyNewRound(
                updatingRound.roundNumber < this.deltas.length ? this.deltas[updatingRound.roundNumber] : null
            )

            // Snapshots should always be the round state just after starting (at turn 0)
            if (this.shouldSnapshot(updatingRound.roundNumber)) {
                this.snapshots.push(updatingRound.copy())
            }
        }

        updatingRound.isTransient = false

        this.currentRound = updatingRound
    }

    private getClosestSnapshot(roundNumber: number): Round {
        const snapshotIndex = Math.floor((roundNumber - 1) / SNAPSHOT_EVERY)
        const snapshot =
            snapshotIndex < this.snapshots.length
                ? this.snapshots[snapshotIndex]
                : this.snapshots[this.snapshots.length - 1]
        assert(snapshot, 'No viable snapshots found (there should always be a round 1 snapshot)')
        assert(snapshot.turnNumber === 0, 'Snapshot should always be at turn 0')
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
