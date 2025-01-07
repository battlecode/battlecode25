import React, { useEffect, useState, MouseEvent, PropsWithChildren } from 'react'

import { ChromePicker } from 'react-color'
import { AppContextProvider, useAppContext } from './app-context'
import { GameRenderer } from './playback/GameRenderer'
import {
    Colors,
    currentColors,
    updateGlobalColor,
    getGlobalColor,
    resetGlobalColors,
    DEFAULT_GLOBAL_COLORS
} from './colors'
import { BrightButton, Button } from './components/button'

export type ClientConfig = typeof DEFAULT_CONFIG

interface Props {
    open: boolean
}

const DEFAULT_CONFIG = {
    showAllIndicators: false,
    showAllRobotRadii: false,
    showHealthBars: false,
    showMapXY: true,
    showFlagCarryIndicator: true,
    streamRunnerGames: false,
    validateMaps: false,
    colors: {
        [Colors.TEAM_ONE]: '#8648d9',
        [Colors.TEAM_TWO]: '#ffadcd',

        [Colors.PAINT_TEAMONE_ONE]: '#1d4f6c',
        [Colors.PAINT_TEAMONE_TWO]: '#ffffff',
        [Colors.PAINT_TEAMTWO_ONE]: '#ffffff',
        [Colors.PAINT_TEAMTWO_TWO]: '#ffffff',
        [Colors.WALLS_COLOR]: '#3B6B4C',
        [Colors.RUINS_COLOR]: '#153e30',
        [Colors.GAMEAREA_BACKGROUND]: '#313847',

        [Colors.ATTACK_COLOR]: '#db6b5c',
        [Colors.BUILD_COLOR]: '#c573c9',
        [Colors.HEAL_COLOR]: '#f2b804'
    } as Record<Colors, string>
}

const configDescription: { [key: string]: string } = {
    showAllIndicators: 'Show all indicator dots and lines',
    showAllRobotRadii: 'Show all robot view and attack radii',
    showHealthBars: 'Show health bars below all robots',
    showMapXY: 'Show X,Y when hovering a tile',
    showFlagCarryIndicator: 'Show an obvious indicator over flag carriers',
    streamRunnerGames: 'Stream each round from the runner live as the game is being played',
    validateMaps: 'Validate maps before running a game'
}

export function getDefaultConfig(): ClientConfig {
    const config: ClientConfig = { ...DEFAULT_CONFIG }
    for (const key in config) {
        const value = localStorage.getItem('config' + key)
        if (value) config[key as keyof ClientConfig] = JSON.parse(value)
    }

    for (const key in config.colors) {
        const value = localStorage.getItem('config-colors' + key)
        if (value) {
            config.colors[key as Colors] = JSON.parse(value)
            updateGlobalColor(key as Colors, JSON.parse(value))
        }
    }

    return config
}

//const ColorRow = (props: { displayName: string, colorName: Colors }) => {
//    return (
//        <>
//            <ColorPicker name={colorName} />
//        </>
//    )
//}

const ColorPicker = (props: { displayName: string; colorName: Colors }) => {
    const context = useAppContext()
    const value = context.state.config.colors[props.colorName]

    const [displayColorPicker, setDisplayColorPicker] = useState(false)

    const handleClick = () => {
        setDisplayColorPicker(!displayColorPicker)
    }

    const handleClose = () => {
        setDisplayColorPicker(false)
    }

    const onChange = (newColor: any) => {
        updateGlobalColor(props.colorName, newColor.hex)
        context.setState((prevState) => ({
            ...prevState,
            config: { ...prevState.config, colors: { ...prevState.config.colors, [props.colorName]: newColor.hex } }
        }))
        // hopefully after the setState is done
        setTimeout(() => GameRenderer.render(), 10)
    }

    return (
        <>
            <div className={'ml-2 text-xs flex flex-start justify-start items-center'}>
                {/*Background:*/}
                {props.displayName}:
                <button
                    className={'text-xs ml-2 px-4 py-3 flex flex-row hover:bg-cyanDark rounded-md text-white'}
                    style={{ backgroundColor: value }}
                    onClick={handleClick}
                ></button>
            </div>

            {displayColorPicker && <ChromePicker color={value} onChange={onChange} />}
        </>
    )
}

export const ConfigPage: React.FC<Props> = (props) => {
    if (!props.open) return null
    const context = useAppContext()

    return (
        <div className={'flex flex-col'}>
            <div className="mb-2">Edit Client Config:</div>
            {Object.entries(DEFAULT_CONFIG).map(([key, value]) => {
                if (typeof value === 'string') return <ConfigStringElement configKey={key} key={key} />
                if (typeof value === 'boolean') return <ConfigBooleanElement configKey={key} key={key} />
                if (typeof value === 'number') return <ConfigNumberElement configKey={key} key={key} />
            })}

            <div>
                <br></br>
            </div>
            <div className="color-pickers">
                {/*fake class*/}
                Customize Colors:
                <div className="text-sm">General</div>
                <ColorPicker displayName={'Background'} colorName={Colors.GAMEAREA_BACKGROUND} />
                <ColorPicker displayName={'Walls'} colorName={Colors.WALLS_COLOR} />
                <div className="text-sm">Team One</div>
                <ColorPicker displayName={'Paint One'} colorName={Colors.PAINT_TEAMONE_ONE} />
                <ColorPicker displayName={'Paint Two'} colorName={Colors.PAINT_TEAMONE_TWO} />
                <div className="text-sm">Team Two</div>
                <ColorPicker displayName={'Paint One'} colorName={Colors.PAINT_TEAMTWO_ONE} />
                <ColorPicker displayName={'Paint Two'} colorName={Colors.PAINT_TEAMTWO_TWO} />
            </div>
            <div className="flex flex-row mt-8">
                <BrightButton
                    className=""
                    onClick={() => {
                        resetGlobalColors()

                        context.setState((prevState) => ({
                            ...prevState,
                            config: { ...prevState.config, colors: { ...DEFAULT_GLOBAL_COLORS } }
                        }))
                    }}
                >
                    Reset Colors
                </BrightButton>
            </div>
        </div>
    )
}

const ConfigBooleanElement: React.FC<{ configKey: string }> = ({ configKey }) => {
    const context = useAppContext()
    const value = context.state.config[configKey as keyof ClientConfig]
    return (
        <div className={'flex flex-row items-center mb-2'}>
            <input
                type={'checkbox'}
                checked={value as any}
                onChange={(e) => {
                    context.setState((prevState) => ({
                        ...prevState,
                        config: { ...prevState.config, [configKey]: e.target.checked }
                    }))
                    localStorage.setItem('config' + configKey, JSON.stringify(e.target.checked))
                    // hopefully after the setState is done
                    setTimeout(() => GameRenderer.render(), 10)
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

const ConfigNumberElement: React.FC<{ configKey: string }> = ({ configKey }) => {
    const context = useAppContext()
    const value = context.state.config[configKey as keyof ClientConfig]
    return <div className={'flex flex-row items-center'}>Todo</div>
}
