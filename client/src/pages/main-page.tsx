import React from 'react'
import { AppContextProvider } from '../app-context'
import { ControlsBar } from '../components/controls-bar/controls-bar'
import { Sidebar } from '../components/sidebar/sidebar'
import { GameArea } from '../components/game/game-area'
import { GAMEAREA_BACKGROUND } from '../constants'
import { useGame } from '../playback/GameRunner'
import { ErrorBoundary } from '../error-boundary'

export const MainPage: React.FC = () => {
    const game = useGame()

    return (
        <AppContextProvider>
            <ErrorBoundary>
                <div className="flex overflow-hidden" style={{ backgroundColor: GAMEAREA_BACKGROUND }}>
                    <Sidebar />
                    <div className="w-full h-screen flex justify-center">
                        <GameArea />
                        {game?.playable && <ControlsBar />}
                    </div>
                </div>
            </ErrorBoundary>
        </AppContextProvider>
    )
}
