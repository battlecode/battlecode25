import React from 'react'
import Game from './playback/Game'
import Match from './playback/Match'
import Tournament, { DEFAULT_TOURNAMENT_STATE, TournamentState } from './playback/Tournament'
import { ClientConfig, getDefaultConfig } from './client-config'

export interface AppState {
    queue: Game[]
    tournament: Tournament | undefined
    tournamentState: TournamentState
    loadingRemoteContent: string
    updatesPerSecond: number
    paused: boolean
    disableHotkeys: boolean
    config: ClientConfig
}

const DEFAULT_APP_STATE: AppState = {
    queue: [],
    tournament: undefined,
    tournamentState: DEFAULT_TOURNAMENT_STATE,
    loadingRemoteContent: '',
    updatesPerSecond: 1,
    paused: true,
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
