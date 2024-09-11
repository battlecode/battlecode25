import React from 'react'
import Game from './Game'
import Match from './Match'
import Turn from './Turn'
import { EventType } from '../app-events'

class GameRunner {
    game: Game | undefined = undefined
    _gameListeners: ((game: Game | undefined) => void)[] = []
    match: Match | undefined = undefined
    _matchListeners: ((match: Match | undefined) => void)[] = []
    _turnListeners: ((turn: Turn | undefined) => void)[] = []

    constructor() {
        document.addEventListener(EventType.TURN_PROGRESS as string, () => this._updateTurnListeners())
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
        this._matchListeners.forEach((listener) => listener(match))
        if (!this.game && match) {
            this.setGame(match.game)
        }
        this._updateTurnListeners()
    }

    selectMatch(match: Match): void {
        match.game.currentMatch = match
        this.setMatch(match)
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

export default gameRunner
export { useGame, useMatch, useTurn }
