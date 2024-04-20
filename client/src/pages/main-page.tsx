import React from 'react'
import { AppContextProvider } from '../app-context'
import { ControlsBar } from '../components/controls-bar/controls-bar'
import { Sidebar } from '../components/sidebar/sidebar'
import { GameArea } from '../components/game/game-area'
import { GAMEAREA_BACKGROUND } from '../current-game/Constants'

export const MainPage: React.FC = () => {
    return (
        <AppContextProvider>
            <div className="flex overflow-hidden" style={{ backgroundColor: GAMEAREA_BACKGROUND }}>
                <Sidebar />
                <GameArea />
            </div>
        </AppContextProvider>
    )
}
