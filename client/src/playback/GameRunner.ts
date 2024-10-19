import React from 'react'
import Game from './Game'
import Match from './Match'
import Turn from './Turn'
import { GameRenderer } from './GameRenderer'

const SIMULATION_UPDATE_INTERVAL_MS = 17 // About 60 fps

class gameRunnerClass {
    targetUPS: number = 1
    currentUPSBuffer: number[] = []
    paused: boolean = true

    game: Game | undefined = undefined
    get match(): Match | undefined {
        return this.game?.currentMatch
    }

    _controlListeners: (() => void)[] = []
    _gameListeners: (() => void)[] = []
    _matchListeners: (() => void)[] = []
    _turnListeners: (() => void)[] = []

    eventLoop: NodeJS.Timeout | undefined = undefined

    private startEventLoop(): void {
        if (this.eventLoop) return

        this.eventLoop = setInterval(() => {
            if (!this.match || this.paused) {
                this.shutDownEventLoop()
                return
            }

            const prevTurn = this.match!.currentTurn.turnNumber

            const msPerUpdate = 1000 / this.targetUPS
            const updatesPerInterval = SIMULATION_UPDATE_INTERVAL_MS / msPerUpdate

            const { anythingChanged, turnChanged } = this.match!._stepSimulation(updatesPerInterval)
            if (anythingChanged) GameRenderer.render()
            if (turnChanged) this._trigger(this._turnListeners)

            if (prevTurn != this.match.currentTurn.turnNumber) {
                this.currentUPSBuffer.push(Date.now())
                while (this.currentUPSBuffer.length > 0 && this.currentUPSBuffer[0] < Date.now() - 1000)
                    this.currentUPSBuffer.shift()
            }

            if (this.match.currentTurn.isEnd() && this.targetUPS > 0) {
                this.setPaused(true)
            }
        }, SIMULATION_UPDATE_INTERVAL_MS)
    }

    private shutDownEventLoop(): void {
        if (!this.eventLoop) return

        // Snap bots to their actual position when paused by rounding simulation to the true turn
        if (this.match) {
            this.match._roundSimulation()
            GameRenderer.render()
        }
        clearInterval(this.eventLoop)
        this.eventLoop = undefined
    }

    private updateEventLoop(): void {
        if (!this.match || this.paused) {
            this.shutDownEventLoop()
        } else {
            this.startEventLoop()
        }
    }

    setGame(game: Game | undefined): void {
        if (this.game == game) return
        this.game = game
        this._trigger(this._gameListeners)
    }

    _trigger(listeners: (() => void)[]): void {
        setTimeout(() => {
            listeners.forEach((l) => l())
        })
    }

    setMatch(match: Match | undefined): void {
        this._trigger(this._matchListeners)
        if (this.match == match) return
        if (match) {
            match.game.currentMatch = match
            this.setGame(match.game)
            match._jumpToTurn(0)
            match._roundSimulation()
            GameRenderer.render()
        }
        this.setPaused(true)
        GameRenderer.onMatchChange()
    }

    multiplyUpdatesPerSecond(multiplier: number) {
        if (!this.match) return
        const scaled = this.targetUPS * multiplier
        const newMag = Math.max(1 / 4, Math.min(64, Math.abs(scaled)))
        this.targetUPS = Math.sign(scaled) * newMag
        this._trigger(this._controlListeners)
    }

    setPaused(paused: boolean): void {
        if (!this.match) return
        this.paused = paused
        if (!paused && this.targetUPS == 0) this.targetUPS = 1
        this.updateEventLoop()
        this._trigger(this._controlListeners)
    }

    stepTurn(delta: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._stepTurn(delta)
        this.match._roundSimulation()
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    jumpToTurn(turn: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToTurn(turn)
        this.match._roundSimulation()
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    jumpToEnd() {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToEnd()
        this.match._roundSimulation()
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    nextMatch() {
        if (!this.match || !this.game) return
        const prevMatchIndex = this.game.matches.indexOf(this.match)
        if (prevMatchIndex + 1 == this.game.matches.length) {
            this.setGame(undefined)
        } else {
            this.setMatch(this.game.matches[prevMatchIndex + 1])
        }
    }
}

const gameRunner = new gameRunnerClass()

export function useGame(): Game | undefined {
    const [game, setGame] = React.useState(gameRunner.game)
    React.useEffect(() => {
        const listener = () => setGame(gameRunner.game)
        gameRunner._gameListeners.push(listener)
        return () => {
            gameRunner._gameListeners = gameRunner._gameListeners.filter((l) => l !== listener)
        }
    }, [])
    return game
}

export function useMatch(): Match | undefined {
    const game = useGame()
    const [match, setMatch] = React.useState(game?.currentMatch)
    // Update on match properties as well
    const [maxTurn, setMaxTurn] = React.useState(game?.currentMatch?.maxTurn)
    const [winner, setWinner] = React.useState(game?.currentMatch?.winner)
    React.useEffect(() => {
        const listener = () => {
            setMatch(game?.currentMatch)
            setMaxTurn(game?.currentMatch?.maxTurn)
            setWinner(game?.currentMatch?.winner)
        }
        gameRunner._matchListeners.push(listener)
        return () => {
            gameRunner._matchListeners = gameRunner._matchListeners.filter((l) => l !== listener)
        }
    }, [game])
    return game?.currentMatch
}

export function useTurn(): Turn | undefined {
    const match = useMatch()
    const [turn, setTurn] = React.useState(match?.currentTurn)
    // Update on turn properties as well
    const [turnNumber, setTurnNumber] = React.useState(match?.currentTurn?.turnNumber)
    React.useEffect(() => {
        const listener = () => {
            setTurn(match?.currentTurn)
            setTurnNumber(match?.currentTurn?.turnNumber)
        }
        gameRunner._turnListeners.push(listener)
        return () => {
            gameRunner._turnListeners = gameRunner._turnListeners.filter((l) => l !== listener)
        }
    }, [match])
    return match?.currentTurn
}

export function useControls(): {
    targetUPS: number
    paused: boolean
} {
    const [targetUPS, setTargetUPS] = React.useState(gameRunner.targetUPS)
    const [paused, setPaused] = React.useState(gameRunner.paused)
    React.useEffect(() => {
        const listener = () => {
            setTargetUPS(gameRunner.targetUPS)
            setPaused(gameRunner.paused)
        }
        gameRunner._controlListeners.push(listener)
        return () => {
            gameRunner._controlListeners = gameRunner._controlListeners.filter((l) => l !== listener)
        }
    }, [])
    return { targetUPS, paused }
}

export function useCurrentUPS(): number {
    const [currentUPS, setCurrentUPS] = React.useState(gameRunner.currentUPSBuffer.length)
    React.useEffect(() => {
        const listener = () => setCurrentUPS(gameRunner.currentUPSBuffer.length)
        gameRunner._controlListeners.push(listener)
        gameRunner._turnListeners.push(listener)
        return () => {
            gameRunner._controlListeners = gameRunner._controlListeners.filter((l) => l !== listener)
            gameRunner._turnListeners = gameRunner._turnListeners.filter((l) => l !== listener)
        }
    }, [])
    return currentUPS
}

export default gameRunner
