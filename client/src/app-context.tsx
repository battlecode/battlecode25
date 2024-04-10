import React from 'react'
import Game from './current-game/Game'
import Match from './current-game/Match'
import { ClientConfig, getDefaultConfig } from './client-config'
import Tournament, { DEFAULT_TOURNAMENT_STATE, TournamentState } from './components/game/tournament-renderer/Tournament'

export interface AppState {
    queue: Game[]
    activeGame: Game | undefined
    activeMatch: Match | undefined
    tournament: Tournament | undefined
    tournamentState: TournamentState
    loadingRemoteContent: string
    disableHotkeys: boolean
    config: ClientConfig
}

const DEFAULT_APP_STATE: AppState = {
    queue: [],
    activeGame: undefined,
    activeMatch: undefined,
    tournament: undefined,
    tournamentState: DEFAULT_TOURNAMENT_STATE,
    loadingRemoteContent: '',
    disableHotkeys: false,
    config: getDefaultConfig()
}

export interface AppContext {
    state: AppState
    setState: (value: React.SetStateAction<AppState>) => void
}

interface Props {
    children: React.ReactNode[] | React.ReactNode
}

const appContext = React.createContext({} as AppContext)
export const AppContextProvider: React.FC<Props> = (props) => {
    const [appState, setAppState] = React.useState(DEFAULT_APP_STATE)

    return (
        <appContext.Provider value={{ state: appState, setState: setAppState }}>{props.children}</appContext.Provider>
    )
}

export const useAppContext = () => React.useContext(appContext)
