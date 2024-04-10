import Match from './Match'
import { flatbuffers, schema } from 'battlecode-schema'
import { ungzip } from 'pako'
import assert from 'assert'
import { SPEC_VERSION, TEAM_COLORS, TEAM_COLOR_NAMES } from './Constants'
import { FakeGameWrapper } from '../components/sidebar/runner/websocket'

let nextID = 0

export type EventList = (
    | schema.GameHeader
    | schema.GameFooter
    | schema.MatchHeader
    | schema.MatchFooter
    | schema.Round
)[]

export default class Game {
    public readonly matches: Match[] = []
    public currentMatch: Match | undefined = undefined
    public readonly teams: [Team, Team]
    public winner: Team | null = null

    // Metadata
    private readonly specVersion: string
    public readonly constants: schema.GameplayConstants
    public readonly specializationMetadata: schema.SpecializationMetadata[] = []
    public readonly buildActionMetadata: schema.BuildActionMetadata[] = []
    public readonly globalUpgradeMetadata: schema.GlobalUpgradeMetadata[] = []

    /**
     * Whether this game is playable (not currently being made in the map editor)
     */
    public readonly playable: boolean

    //shared slots for efficiency??
    public _bodiesSlot: schema.SpawnedBodyTable = new schema.SpawnedBodyTable()
    public _vecTableSlot1: schema.VecTable = new schema.VecTable()

    /**
     * The ID of this game. This is used to uniquely identify games in the UI, and is just based on uploaded order
     */
    public readonly id: number

    constructor(wrapper?: schema.GameWrapper | FakeGameWrapper) {
        this.playable = !!wrapper

        if (!wrapper) {
            //bare minimum setup for map editor
            this.teams = [
                new Team(TEAM_COLOR_NAMES[0], { wins: 0, elo: 0 }, 1, 'map_editor_red'),
                new Team(TEAM_COLOR_NAMES[1], { wins: 0, elo: 0 }, 2, 'map_editor_blue')
            ]
            this.winner = this.teams[0]
            this.specVersion = SPEC_VERSION
            this.constants = new schema.GameplayConstants()
            this.id = nextID++
            this.playable = false
            return
        }

        const eventCount = wrapper.eventsLength()
        const eventSlot = new schema.EventWrapper() // not sure what this is for, probably better performance (this is how it was done in the old client)

        // load header and metadata =============================================================================
        const gameHeaderEvent = wrapper.events(0, eventSlot) ?? assert.fail('Event was null')
        assert(gameHeaderEvent.eType() === schema.Event.GameHeader, 'First event must be GameHeader')
        const gameHeader = gameHeaderEvent.e(new schema.GameHeader()) as schema.GameHeader
        this.specVersion = (gameHeader.specVersion() as string) || assert.fail('Unknown spec version')
        this.teams = [
            Team.fromSchema(gameHeader.teams(0) ?? assert.fail('Team 0 was null')),
            Team.fromSchema(gameHeader.teams(1) ?? assert.fail('Team 1 was null'))
        ]

        for (let i = 0; i < gameHeader.specializationMetadataLength(); i++) {
            const data = gameHeader.specializationMetadata(i) ?? assert.fail('SpecializationMetadata was null')
            this.specializationMetadata[data.type()] = data
        }
        for (let i = 0; i < gameHeader.buildActionMetadataLength(); i++) {
            const data = gameHeader.buildActionMetadata(i) ?? assert.fail('BuildActionMetadata was null')
            this.buildActionMetadata[data.type()] = data
        }
        for (let i = 0; i < gameHeader.globalUpgradeMetadataLength(); i++) {
            const data = gameHeader.globalUpgradeMetadata(i) ?? assert.fail('GlobalUpgradeMetadata was null')
            this.globalUpgradeMetadata[data.type()] = data
        }
        this.constants = gameHeader.constants() ?? assert.fail('Constants was null')

        // load all other events  ==========================================================================================
        for (let i = 1; i < eventCount; i++) {
            const event = wrapper.events(i, eventSlot) ?? assert.fail('Event was null')
            this.addEvent(event)
        }

        this.id = nextID++
    }

    /*
     * Adds a new game event to the game. Used for live match replaying.
     */
    public addEvent(event: schema.EventWrapper): void {
        switch (event.eType()) {
            case schema.Event.GameHeader: {
                assert(false, 'Cannot add another GameHeader event to Game')
            }
            case schema.Event.MatchHeader: {
                const header = event.e(new schema.MatchHeader()) as schema.MatchHeader
                this.matches.push(Match.fromSchema(this, header, []))
                this.currentMatch = this.matches[this.matches.length - 1]
                return
            }
            case schema.Event.Round: {
                assert(
                    this.matches.length > 0,
                    'Cannot add Round event to Game if no MatchHeaders have been added first'
                )
                const round = event.e(new schema.Round()) as schema.Round
                this.matches[this.matches.length - 1].addNewTurn(round)
                return
            }
            case schema.Event.MatchFooter: {
                assert(
                    this.matches.length > 0,
                    'Cannot add MatchFooter event to Game if no MatchHeaders have been added first'
                )
                const footer = event.e(new schema.MatchFooter()) as schema.MatchFooter
                this.matches[this.matches.length - 1].addMatchFooter(footer)
                return
            }
            case schema.Event.GameFooter: {
                assert(this.winner === null, 'Cannot add another GameFooter event to Game')
                const footer = event.e(new schema.GameFooter()) as schema.GameFooter
                this.winner = this.teams[footer.winner() - 1]
                return
            }
            default: {
                console.log(`Unknown event type: ${event.eType()}`)
                return
            }
        }
    }

    public getTeamByID(id: number): Team {
        for (const team of this.teams) if (team.id === id) return team
        throw new Error('Team not found')
    }

    /**
     * Load a full game from a gzipped ArrayBuffer containing a GameWrapper.
     *
     * Do not mutate `data` after calling this function!
     */
    public static loadFullGameRaw(data: ArrayBuffer): Game {
        const ungzipped = ungzip(new Uint8Array(data))
        console.log('Game un-gzipped!')
        const wrapper = schema.GameWrapper.getRootAsGameWrapper(new flatbuffers.ByteBuffer(ungzipped))
        return new Game(wrapper)
    }
}

export class Team {
    public readonly colorName: string
    public readonly color: string
    constructor(
        public readonly name: string,
        public stats: TeamStat,
        public readonly id: number,
        public readonly packageName: string
    ) {
        this.colorName = TEAM_COLOR_NAMES[id - 1]
        this.color = TEAM_COLORS[id - 1]
    }

    static fromSchema(team: schema.TeamData) {
        const name = team.name() ?? assert.fail('Team name is missing')
        const stats = {
            wins: 0,
            elo: 0
        }
        const id = team.teamId() ?? assert.fail('Team id is missing')
        const packageName = team.packageName() ?? assert.fail('Team package name is missing')
        return new Team(name, stats, id, packageName)
    }
}

export type TeamStat = {
    wins: number
    elo: number
}
