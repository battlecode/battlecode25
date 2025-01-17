import { schema, flatbuffers } from 'battlecode-schema'
import Game from '../../../playback/Game'
import Match from '../../../playback/Match'
import assert from 'assert'
import GameRunner from '../../../playback/GameRunner'

export type FakeGameWrapper = {
    events: (index: number, unusedEventSlot: any) => schema.EventWrapper | null
    eventsLength: () => number
}

export default class WebSocketListener {
    url: string = 'ws://localhost:6175'
    pollEvery: number = 500
    activeGame: Game | null = null
    activeMatch: Match | null = null
    lastSetRound: number = 1
    stream: boolean = false
    constructor(
        private shouldStream: boolean,
        readonly onGameCreated: (game: Game) => void,
        readonly onMatchCreated: (match: Match) => void,
        readonly onGameComplete: (game: Game) => void
    ) {
        this.reset()
        this.poll()
    }

    public setShouldStream(stream: boolean) {
        this.shouldStream = stream
    }

    private reset() {
        this.activeGame = null
        this.activeMatch = null
        this.lastSetRound = 1
    }

    private poll() {
        const ws = new WebSocket(this.url)
        ws.binaryType = 'arraybuffer'
        ws.onopen = (event) => {
            console.log(`Connected to ${this.url}`)
        }
        ws.onmessage = (event) => {
            this.handleEvent(<ArrayBuffer>event.data)
        }
        ws.onerror = (event) => {
            this.reset()
        }
        ws.onclose = (event) => {
            this.reset()
            window.setTimeout(() => {
                this.poll()
            }, this.pollEvery)
        }
    }

    private visualUpdate() {
        if (!this.activeGame) return

        // Auto progress the round if the user hasn't done it themselves
        // We only want to do this if the currently selected match is the one being updated
        if (this.activeMatch && this.activeMatch === GameRunner.match) {
            const newRound = Math.max(this.activeMatch.maxRound - 2, 1)
            if (this.lastSetRound == this.activeMatch.currentRound.roundNumber) {
                GameRunner.jumpToRound(newRound)
                this.lastSetRound = newRound
            }
        }

        window.requestAnimationFrame(() => this.visualUpdate())
    }

    private handleEvent(data: ArrayBuffer) {
        const event = schema.EventWrapper.getRootAsEventWrapper(new flatbuffers.ByteBuffer(new Uint8Array(data)))
        const eventType = event.eType()

        if (this.activeGame === null) {
            assert(eventType === schema.Event.GameHeader, 'First event must be GameHeader')

            const fakeGameWrapper: FakeGameWrapper = {
                events: () => event,
                eventsLength: () => 1
            }

            this.stream = this.shouldStream
            this.activeGame = new Game(fakeGameWrapper)

            if (this.stream) {
                this.onGameCreated(this.activeGame)
                window.requestAnimationFrame(() => this.visualUpdate())
            }

            return
        }

        this.activeGame.addEvent(event)

        switch (eventType) {
            case schema.Event.Round: {
                if (!this.stream) break

                // We want to set the match only once the first round comes in,
                // otherwise our current simulation setup will break if no rounds
                // exist
                const currentMatch = this.activeGame.matches[this.activeGame.matches.length - 1]
                if (this.activeMatch === currentMatch) break

                this.onMatchCreated(currentMatch)
                this.activeMatch = currentMatch
                this.lastSetRound = currentMatch.currentRound.roundNumber

                break
            }
            case schema.Event.GameFooter: {
                this.onGameComplete(this.activeGame!)
                this.reset()

                break
            }
            default:
                break
        }
    }
}
