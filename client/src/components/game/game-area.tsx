import React from 'react'
import { GameRenderer } from './game-renderer'
import { useAppContext } from '../../app-context'
import { TournamentRenderer } from './tournament-renderer/tournament-renderer'
import { useGame } from '../../playback/GameRunner'

export const GameArea: React.FC = () => {
    const appContext = useAppContext()
    const game = useGame()

    if (appContext.state.loadingRemoteContent) {
        return (
            <div className="relative w-full h-screen flex items-center justify-center">
                <p className="text-white text-center">{`Loading remote ${appContext.state.loadingRemoteContent}...`}</p>
            </div>
        )
    }

    if (!game && appContext.state.tournament) {
        return <TournamentRenderer />
    }

    return <GameRenderer />
}
