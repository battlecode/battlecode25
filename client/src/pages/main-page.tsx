import React from 'react'
import { AppContextProvider } from '../app-context'
import { ControlsBar } from '../components/controls-bar/controls-bar'
import { Sidebar } from '../components/sidebar/sidebar'
import { GameArea } from '../components/game/game-area'
import { Colors } from '../colors'
import { useGame } from '../playback/GameRunner'

export const MainPage: React.FC = () => {
    const game = useGame()

    return (
        <AppContextProvider>
            <div className="flex overflow-hidden" style={{ backgroundColor: Colors.GAMEAREA_BACKGROUND }}>
                <Sidebar />
                <div className="w-full h-screen flex justify-center">
                    <GameArea />
                    {game?.playable && <ControlsBar />}
                </div>
            </div>
        </AppContextProvider>
    )
}
