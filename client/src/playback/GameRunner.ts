import React from 'react'
import Game from './Game'
import Match from './Match'
import Turn from './Turn'
import { EventType } from '../app-events'

const SIMULATION_UPDATE_INTERVAL_MS = 17 // About 60 fps

class GameRunner {
    targetUPS: number = 1
    currentUPSBuffer: number[] = []
    paused: boolean = true
    _controlListeners: (() => void)[] = []

    game: Game | undefined = undefined
    _gameListeners: ((game: Game | undefined) => void)[] = []
    match: Match | undefined = undefined
    _matchListeners: ((match: Match | undefined) => void)[] = []
    _turnListeners: ((turn: Turn | undefined) => void)[] = []

    eventLoop: NodeJS.Timeout | undefined = undefined

    constructor() {
        document.addEventListener(EventType.TURN_PROGRESS as string, () => this._updateTurnListeners())
    }

    startEventLoop(): void {
        if (this.eventLoop) throw new Error('Event loop already exists')

        this.eventLoop = setInterval(() => {
            if (!this.match || this.paused) {
                this.shutDownEventLoop()
                return
            }

            const prevTurn = this.match!.currentTurn.turnNumber

            const msPerUpdate = 1000 / this.targetUPS
            const updatesPerInterval = SIMULATION_UPDATE_INTERVAL_MS / msPerUpdate
            this.match!.stepSimulation(updatesPerInterval)

            if (prevTurn != this.match!.currentTurn.turnNumber) {
                this.currentUPSBuffer.push(Date.now())
                while (this.currentUPSBuffer.length > 0 && this.currentUPSBuffer[0] < Date.now() - 1000)
                    this.currentUPSBuffer.shift()
            }

            if (this.match!.currentTurn.isEnd() && this.targetUPS > 0) {
                this.setPaused(true)
            }
        }, SIMULATION_UPDATE_INTERVAL_MS)
    }

    shutDownEventLoop(): void {
        if (!this.eventLoop) throw new Error('Event loop does not exist')
        // Snap bots to their actual position when paused by rounding simulation to the true turn
        if (this.match) {
            this.match.roundSimulation()
            this.match.rerender()
        }
        clearInterval(this.eventLoop)
        this.eventLoop = undefined
    }

    updateEventLoop(): void {
        if (this.match && !this.paused && !this.eventLoop) {
            this.startEventLoop()
        } else if (this.eventLoop) {
            this.shutDownEventLoop()
        }
    }

    _updateTurnListeners(): void {
        this._turnListeners.forEach((listener) => listener(this.match?.currentTurn))
    }

    setGame(game: Game | undefined): void {
        this.game = game
        this._gameListeners.forEach((listener) => listener(game))
        if (!game && this.match) {
            this.setMatch(undefined)
        }
        this._updateTurnListeners()
    }

    setMatch(match: Match | undefined): void {
        this.match = match
        this.paused = true
        this._updateControlListeners()
        this._matchListeners.forEach((listener) => listener(match))
        if (!this.game && match) {
            this.setGame(match.game)
        }
        this.updateEventLoop()
        this._updateTurnListeners()
    }

    selectMatch(match: Match): void {
        match.game.currentMatch = match
        this.setMatch(match)
    }

    _updateControlListeners(): void {
        this._controlListeners.forEach((listener) => listener())
    }

    multiplyUpdatesPerSecond(multiplier: number) {
        if (!this.match) return
        const scaled = this.targetUPS * multiplier
        const newMag = Math.max(1 / 4, Math.min(64, Math.abs(scaled)))
        this.targetUPS = Math.sign(scaled) * newMag
        this._updateControlListeners()
    }

    setPaused(paused: boolean): void {
        if (!this.match) return
        this.paused = paused
        if (!paused && this.targetUPS == 0) this.targetUPS = 1
        this.updateEventLoop()
        this._updateControlListeners()
    }

    stepTurn(delta: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match!.stepTurn(delta, false)
        this.match!.roundSimulation()
        this.match!.rerender()
    }

    jumpToTurn(turn: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match!.jumpToTurn(turn, false)
        this.match!.roundSimulation()
        this.match!.rerender()
    }

    jumpToEnd() {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match!.jumpToEnd(false)
        this.match!.roundSimulation()
        this.match!.rerender()
    }

    nextMatch() {
        if (!this.match || !this.game) return
        const prevMatchIndex = this.game.matches.indexOf(this.match)
        if (prevMatchIndex + 1 == this.game.matches.length) {
            this.setGame(undefined)
        } else {
            this.selectMatch(this.game.matches[prevMatchIndex + 1])
        }
    }
}

const gameRunner = new GameRunner()

function useGame(): Game | undefined {
    const [game, setGame] = React.useState(gameRunner.game)
    React.useEffect(() => {
        const listener = (game: Game | undefined) => setGame(game)
        gameRunner._gameListeners.push(listener)
        return () => {
            gameRunner._gameListeners = gameRunner._gameListeners.filter((l) => l !== listener)
        }
    }, [])
    return game
}

function useMatch(): Match | undefined {
    const [match, setMatch] = React.useState(gameRunner.match)
    React.useEffect(() => {
        const listener = (match: Match | undefined) => setMatch(match)
        gameRunner._matchListeners.push(listener)
        return () => {
            gameRunner._matchListeners = gameRunner._matchListeners.filter((l) => l !== listener)
        }
    }, [])
    return match
}

function useTurn(): Turn | undefined {
    const [turn, setTurn] = React.useState(gameRunner.match?.currentTurn)
    // since turn objects are reused, we need to update when the turn number changes to force a re-render
    const [turnNumber, setTurnNumber] = React.useState(gameRunner.match?.currentTurn?.turnNumber)
    React.useEffect(() => {
        const listener = (turn: Turn | undefined) => {
            setTurn(turn)
            setTurnNumber(turn?.turnNumber)
        }
        gameRunner._turnListeners.push(listener)
        return () => {
            gameRunner._turnListeners = gameRunner._turnListeners.filter((l) => l !== listener)
        }
    }, [])
    return turn
}

function useControls(): {
    targetUPS: number
    currentUPS: number
    paused: boolean
} {
    const [targetUPS, setTargetUPS] = React.useState(gameRunner.targetUPS)
    const [currentUPS, setCurrentUPS] = React.useState(gameRunner.currentUPSBuffer.length)
    const [paused, setPaused] = React.useState(gameRunner.paused)
    React.useEffect(() => {
        const listener = () => {
            setTargetUPS(gameRunner.targetUPS)
            setCurrentUPS(gameRunner.currentUPSBuffer.length)
            setPaused(gameRunner.paused)
        }
        gameRunner._controlListeners.push(listener)
        return () => {
            gameRunner._controlListeners = gameRunner._controlListeners.filter((l) => l !== listener)
        }
    }, [])
    return { targetUPS, currentUPS, paused }
}

export default gameRunner
export { useGame, useMatch, useTurn, useControls }
