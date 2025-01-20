import React from 'react'
import Game from './Game'
import Match from './Match'
import Round from './Round'
import { GameRenderer } from './GameRenderer'
import { GameConfig } from '../app-context'

const SIMULATION_UPDATE_INTERVAL_MS = 17 // About 60 fps

class GameRunnerClass {
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
    _roundListeners: (() => void)[] = []
    _turnListeners: (() => void)[] = []

    eventLoop: NodeJS.Timeout | undefined = undefined

    private startEventLoop(): void {
        if (this.eventLoop) return

        this.eventLoop = setInterval(() => {
            if (!this.match || this.paused) {
                this.stopEventLoop()
                return
            }

            const prevRound = this.match!.currentRound.roundNumber

            const msPerUpdate = 1000 / this.targetUPS
            const updatesPerInterval = SIMULATION_UPDATE_INTERVAL_MS / msPerUpdate

            const [roundChanged, turnChanged] = this.match!._stepSimulationByTime(updatesPerInterval)

            // Always rerender, so this assumes the simulation pauses when the simulation
            // is over
            GameRenderer.render()

            if (roundChanged) {
                this._trigger(this._roundListeners)
            }
            if (turnChanged) {
                this._trigger(this._turnListeners)
            }

            if (prevRound != this.match.currentRound.roundNumber) {
                this.addNowToUPSBuffer()
            }

            if (this.match.currentRound.isEnd() && this.targetUPS > 0) {
                this.setPaused(true)
            } else if (this.match.currentRound.isStart() && this.targetUPS < 0) {
                this.setPaused(true)
            }
        }, SIMULATION_UPDATE_INTERVAL_MS)
    }

    private addNowToUPSBuffer(): void {
        this.currentUPSBuffer.push(Date.now())
        while (this.currentUPSBuffer.length > 0 && this.currentUPSBuffer[0] < Date.now() - 1000)
            this.currentUPSBuffer.shift()
    }

    private stopEventLoop(): void {
        if (!this.eventLoop) return

        // Snap bots to their actual position when paused by rounding simulation to the true round
        if (this.match) {
            this.match._roundSimulation()
            GameRenderer.render()
        }
        clearInterval(this.eventLoop)
        this.eventLoop = undefined
    }

    private updateEventLoop(): void {
        if (!this.match || this.paused) {
            this.stopEventLoop()
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

    setMatch(match: Match | undefined, round: number = 1): void {
        this._trigger(this._matchListeners)
        if (match) {
            match.game.currentMatch = match
            this.setGame(match.game)
            match._jumpToRound(round)
            GameRenderer.render()
        }
        this.setPaused(true)
        GameRenderer.onMatchChange()
    }

    setPlaybackPerTurn(value: boolean): void {
        if (!this.match) return
        this.match.playbackPerTurn = value
        this._trigger(this._matchListeners)
        GameRenderer.render()
    }

    multiplyUpdatesPerSecond(multiplier: number) {
        if (!this.match) return
        const scaled = this.targetUPS * multiplier
        const newMag = Math.max(1 / 4, Math.min(128, Math.abs(scaled)))
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

    stepRound(delta: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._stepRound(delta)
        GameRenderer.render()
        this._trigger(this._roundListeners)
    }

    stepTurn(delta: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._stepTurn(delta)
        if (GameConfig.config.focusRobotTurn) {
            GameRenderer.setSelectedRobot(this.match.currentRound.lastSteppedRobotId)
        }
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    jumpToRound(round: number) {
        if (!this.match || this.match.currentRound.roundNumber == round) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToRound(round)
        GameRenderer.render()
        this._trigger(this._roundListeners)
    }

    jumpToTurn(turn: number) {
        if (!this.match || this.match.currentRound.turnNumber == turn) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToTurn(turn)
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    jumpToRobotTurn(robotId: number) {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToRobotTurn(robotId)
        GameRenderer.render()
        this._trigger(this._turnListeners)
    }

    jumpToStart() {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToStart()
        GameRenderer.render()
        this._trigger(this._roundListeners)
    }

    jumpToEnd() {
        if (!this.match) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        this.match._jumpToEnd()
        GameRenderer.render()
        this._trigger(this._roundListeners)
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

const GameRunner = new GameRunnerClass()

export function useGame(): Game | undefined {
    const [game, setGame] = React.useState(GameRunner.game)
    React.useEffect(() => {
        const listener = () => setGame(GameRunner.game)
        GameRunner._gameListeners.push(listener)
        return () => {
            GameRunner._gameListeners = GameRunner._gameListeners.filter((l) => l !== listener)
        }
    }, [])
    return game
}

export function useMatch(): Match | undefined {
    const game = useGame()
    const [match, setMatch] = React.useState(game?.currentMatch)
    // Update on match properties as well
    const [maxRound, setMaxRound] = React.useState(game?.currentMatch?.maxRound)
    const [winner, setWinner] = React.useState(game?.currentMatch?.winner)
    React.useEffect(() => {
        const listener = () => {
            setMatch(game?.currentMatch)
            setMaxRound(game?.currentMatch?.maxRound)
            setWinner(game?.currentMatch?.winner)
        }
        GameRunner._matchListeners.push(listener)
        return () => {
            GameRunner._matchListeners = GameRunner._matchListeners.filter((l) => l !== listener)
        }
    }, [game])
    return game?.currentMatch
}

export function useRound(): Round | undefined {
    const match = useMatch()
    const [round, setRound] = React.useState(match?.currentRound)
    // Update on round properties as well
    const [roundNumber, setRoundNumber] = React.useState(match?.currentRound?.roundNumber)
    React.useEffect(() => {
        const listener = () => {
            setRound(match?.currentRound)
            setRoundNumber(match?.currentRound?.roundNumber)
        }
        GameRunner._roundListeners.push(listener)
        return () => {
            GameRunner._roundListeners = GameRunner._roundListeners.filter((l) => l !== listener)
        }
    }, [match])
    return match?.currentRound
}

export function useTurnNumber(): { current: number; max: number } | undefined {
    const round = useRound()
    const [turnIdentifierNumber, setTurnIdentifierNumber] = React.useState<number | undefined>(-1)
    React.useEffect(() => {
        const listener = () =>
            setTurnIdentifierNumber(round ? round.roundNumber * round.match.maxRound + round.turnNumber : undefined)
        GameRunner._turnListeners.push(listener)
        return () => {
            GameRunner._turnListeners = GameRunner._turnListeners.filter((l) => l !== listener)
        }
    }, [round])
    return React.useMemo(
        () =>
            round
                ? {
                      current: round.turnNumber,
                      max: round.turnsLength || 0
                  }
                : undefined,
        [round, round?.roundNumber, round?.turnNumber]
    )
}

export function useControls(): {
    targetUPS: number
    paused: boolean
} {
    const [targetUPS, setTargetUPS] = React.useState(GameRunner.targetUPS)
    const [paused, setPaused] = React.useState(GameRunner.paused)
    React.useEffect(() => {
        const listener = () => {
            setTargetUPS(GameRunner.targetUPS)
            setPaused(GameRunner.paused)
        }
        GameRunner._controlListeners.push(listener)
        return () => {
            GameRunner._controlListeners = GameRunner._controlListeners.filter((l) => l !== listener)
        }
    }, [])
    return { targetUPS, paused }
}

export function useCurrentUPS(): number {
    const [currentUPS, setCurrentUPS] = React.useState(GameRunner.currentUPSBuffer.length)
    React.useEffect(() => {
        const listener = () => setCurrentUPS(GameRunner.currentUPSBuffer.length)
        GameRunner._controlListeners.push(listener)
        GameRunner._roundListeners.push(listener)
        return () => {
            GameRunner._controlListeners = GameRunner._controlListeners.filter((l) => l !== listener)
            GameRunner._roundListeners = GameRunner._roundListeners.filter((l) => l !== listener)
        }
    }, [])
    return currentUPS
}

export function usePlaybackPerTurn(): boolean {
    const [playbackPerTurn, setPlaybackPerTurn] = React.useState(GameRunner.match?.playbackPerTurn)
    React.useEffect(() => {
        const listener = () => setPlaybackPerTurn(GameRunner.match?.playbackPerTurn)
        GameRunner._matchListeners.push(listener)
        return () => {
            GameRunner._matchListeners = GameRunner._matchListeners.filter((l) => l !== listener)
        }
    }, [])
    return playbackPerTurn ?? false
}

export default GameRunner
