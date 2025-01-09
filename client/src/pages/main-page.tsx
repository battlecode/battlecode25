import React, { useEffect } from 'react'
import { AppContextProvider, useAppContext } from '../app-context'
import { ControlsBar } from '../components/controls-bar/controls-bar'
import { Sidebar } from '../components/sidebar/sidebar'
import { GameArea } from '../components/game/game-area'
import { Colors, currentColors } from '../colors'
import { useGame } from '../playback/GameRunner'
import { ErrorBoundary } from '../error-boundary'

export const MainPage: React.FC = React.memo(() => {
    const game = useGame()
    const context = useAppContext()

    return (
        <ErrorBoundary>
            <div
                className="flex overflow-hidden"
                style={{ backgroundColor: context.state.config.colors.GAMEAREA_BACKGROUND }}
            >
                <Sidebar />
                <div className="w-full h-screen flex justify-center">
                    <GameArea />
                    {game?.playable && <ControlsBar />}
                </div>
            </div>
        </ErrorBoundary>
    )
})
