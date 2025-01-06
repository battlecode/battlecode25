import React, { useEffect } from 'react'
import { useAppContext } from './app-context'
import { GameRenderer } from './playback/GameRenderer'
import { NumInput } from './components/forms'

export type ClientConfig = typeof DEFAULT_CONFIG

interface Props {
    open: boolean
}

const DEFAULT_CONFIG = {
    showAllIndicators: false,
    showAllRobotRadii: false,
    showTimelineMarkers: true,
    showHealthBars: true,
    showPaintMarkers: true,
    showMapXY: true,
    enableFancyPaint: true,
    streamRunnerGames: true,
    profileGames: false,
    validateMaps: false,
    resolutionScale: 100
}

const configDescription: Record<keyof ClientConfig, string> = {
    showAllIndicators: 'Show all indicator dots and lines',
    showAllRobotRadii: 'Show all robot view and attack radii',
    showTimelineMarkers: 'Show user-generated markers on the timeline',
    showHealthBars: 'Show health bars below all robots',
    showPaintMarkers: 'Show paint markers created using mark()',
    showMapXY: 'Show X,Y when hovering a tile',
    enableFancyPaint: 'Enable fancy paint rendering',
    streamRunnerGames: 'Stream each round from the runner live as the game is being played',
    profileGames: 'Enable saving profiling data when running games',
    validateMaps: 'Validate maps before running a game',
    resolutionScale: 'Resolution scale for the game area. Decrease to help performance.'
}

export function getDefaultConfig(): ClientConfig {
    const config: ClientConfig = { ...DEFAULT_CONFIG }
    for (const key in config) {
        const value = localStorage.getItem('config' + key)
        if (value) {
            ;(config[key as keyof ClientConfig] as any) = JSON.parse(value)
        }
    }
    return config
}

export const ConfigPage: React.FC<Props> = (props) => {
    if (!props.open) return null

    return (
        <div className={'flex flex-col'}>
            <div className="mb-2">Edit Client Config:</div>
            {Object.entries(DEFAULT_CONFIG).map(([k, v]) => {
                const key = k as keyof ClientConfig
                if (typeof v === 'string') return <ConfigStringElement configKey={key} key={key} />
                if (typeof v === 'boolean') return <ConfigBooleanElement configKey={key} key={key} />
                if (typeof v === 'number') return <ConfigNumberElement configKey={key} key={key} />
            })}
        </div>
    )
}

const ConfigBooleanElement: React.FC<{ configKey: keyof ClientConfig }> = ({ configKey }) => {
    const context = useAppContext()
    const value = context.state.config[configKey] as boolean
    return (
        <div className={'flex flex-row items-center mb-2'}>
            <input
                type={'checkbox'}
                checked={value}
                onChange={(e) => {
                    context.setState((prevState) => ({
                        ...prevState,
                        config: { ...context.state.config, [configKey]: e.target.checked }
                    }))
                    localStorage.setItem('config' + configKey, JSON.stringify(e.target.checked))
                    // hopefully after the setState is done
                    setTimeout(() => GameRenderer.fullRender(), 10)
                }}
            />
            <div className={'ml-2 text-xs'}>{configDescription[configKey] ?? configKey}</div>
        </div>
    )
}

const ConfigStringElement: React.FC<{ configKey: string }> = ({ configKey }) => {
    const context = useAppContext()
    const value = context.state.config[configKey as keyof ClientConfig]
    return <div className={'flex flex-row items-center'}>Todo</div>
}

const ConfigNumberElement: React.FC<{ configKey: keyof ClientConfig }> = ({ configKey }) => {
    const context = useAppContext()
    const value = context.state.config[configKey as keyof ClientConfig] as number
    return (
        <div className={'flex flex-row items-center mb-2'}>
            <NumInput
                value={value}
                changeValue={(newVal) => {
                    context.setState((prevState) => ({
                        ...prevState,
                        config: { ...context.state.config, [configKey]: newVal }
                    }))
                    localStorage.setItem('config' + configKey, JSON.stringify(newVal))
                    // hopefully after the setState is done
                    setTimeout(() => {
                        // Trigger canvas dimension update to ensure resolution is updated
                        GameRenderer.onMatchChange()
                    }, 10)
                }}
                min={10}
                max={200}
            />
            <div className={'ml-2 text-xs'}>{configDescription[configKey] ?? configKey}</div>
        </div>
    )
}
