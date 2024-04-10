import React, { useEffect, useRef, useState } from 'react'
import { GameRenderer } from './game-renderer'
import { useAppContext } from '../../app-context'
import { TournamentRenderer } from './tournament-renderer/tournament-renderer'
import { ControlsBar } from '../controls-bar/controls-bar'
import { useSimulationControl } from './GameController';


export const GameArea = () => {
    const { state: appState, setState: setAppState } = useAppContext()
    const currentMatch = appState.activeGame?.currentMatch
    const { paused, setPaused, targetUPS, setTargetUPS, liveUPS } = useSimulationControl(currentMatch)

    const handleNextMatch = () => {
        if (!currentMatch) return
        const game = currentMatch.game
        const prevMatchIndex = game.matches.indexOf(currentMatch)
        if (game.matches[prevMatchIndex + 1] === undefined) return
        game.currentMatch = game.matches[prevMatchIndex + 1]
        setAppState((prevState) => ({
            ...prevState,
            activeGame: game,
            activeMatch: game.currentMatch
        }))
    }

    const handleCloseGame = () => {
        setAppState((prevState) => ({
            ...prevState,
            activeGame: undefined,
            activeMatch: undefined
        }))
    }

    return (
        <div className="w-full h-screen flex justify-center">
            <GameCanvasArea
                loadingRemoteContent={appState.loadingRemoteContent}
                tournamentScreen={!appState.activeGame && !!appState.tournament}
            />
            <ControlsBar
                match={currentMatch}
                paused={paused}
                setPaused={setPaused}
                targetUPS={targetUPS}
                setTargetUPS={setTargetUPS}
                liveUPS={liveUPS}
                nextMatch={handleNextMatch}
                closeGame={handleCloseGame}
            />
        </div>
    )
}

const GameCanvasArea: React.FC<{ loadingRemoteContent: string; tournamentScreen: boolean }> = ({
    loadingRemoteContent,
    tournamentScreen
}) => {
    if (loadingRemoteContent) {
        return (
            <div className="relative w-full h-screen flex items-center justify-center">
                <p className="text-white text-center">{`Loading remote ${loadingRemoteContent}...`}</p>
            </div>
        )
    }

    if (tournamentScreen) {
        return <TournamentRenderer />
    }

    return <GameRenderer />
}
