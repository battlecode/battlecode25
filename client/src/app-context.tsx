import React from 'react'
import Game from './playback/Game'
import Tournament, { DEFAULT_TOURNAMENT_STATE, TournamentState } from './playback/Tournament'
import { ClientConfig, getDefaultConfig } from './client-config'
import { GameRenderer } from './playback/GameRenderer'

export interface TimelineMarker {
    round: number
}

export interface AppState {
    queue: Game[]
    tournament: Tournament | undefined
    tournamentState: TournamentState
    loadingRemoteContent: string
    disableHotkeys: boolean
    config: ClientConfig
}

const DEFAULT_APP_STATE: AppState = {
    queue: [],
    tournament: undefined,
    tournamentState: DEFAULT_TOURNAMENT_STATE,
    loadingRemoteContent: '',
    disableHotkeys: false,
    config: getDefaultConfig()
}

export interface AppContext {
    state: AppState
    setState: (value: React.SetStateAction<AppState>) => void
    updateConfigValue: (key: keyof ClientConfig, newVal: any) => void
}

interface Props {
    children: React.ReactNode[] | React.ReactNode
}

const appContext = React.createContext({} as AppContext)
export const AppContextProvider: React.FC<Props> = (props) => {
    const [appState, setAppState] = React.useState(DEFAULT_APP_STATE)

    GameConfig.config = appState.config

    const updateConfigValue = (key: keyof ClientConfig, newVal: any) => {
        setAppState((prevState) => ({
            ...prevState,
            config: { ...prevState.config, [key]: newVal }
        }))
        localStorage.setItem('config' + key, JSON.stringify(newVal))
        setTimeout(() => {
            // After the setState is done, rerender
            GameRenderer.fullRender()
        }, 10)
    }

    return (
        <appContext.Provider value={{ state: appState, setState: setAppState, updateConfigValue }}>
            {props.children}
        </appContext.Provider>
    )
}

export const useAppContext = () => React.useContext(appContext)

/** Singleton to access the current config from outside of react */
export const GameConfig = { config: getDefaultConfig() }
