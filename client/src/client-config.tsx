import React, { useEffect, useState } from 'react'
import { ChromePicker } from 'react-color'
import { useAppContext } from './app-context'
import { GameRenderer } from './playback/GameRenderer'
import { Colors, currentColors, updateGlobalColor, getGlobalColor, resetGlobalColors } from './colors'

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
    validateMaps: false
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
    return config
}

//export class ColorPicker extends React.Component {
//    state = {
//        color: "#8648d9",
//        name: "TEAM_ONE",
//    };

//    handleChange = (newColor: any) =>  {
//        this.setState({color: newColor.hex});
//    }
    
//    render() {
//        return <ChromePicker
//        color = { this.state.color}
//        onChange={ this.handleChange }
//        />;
//    }
//}

const ColorPicker = (props: {name: Colors}) => {
    const [color, setColor] = useState(getGlobalColor(props.name));

    const onChange = (newColor: any) => {
        setColor(newColor.hex);
        updateGlobalColor(props.name, newColor.hex);
    }

    return <ChromePicker
        color={color}
        onChange={onChange}
    />

}

//export function getColorPickers() {

//    const picker =
//    {
//        name: "TEAM_ONE",
//        color: "#000000",
//    }

//    return (
//        <div className="ColorPickers">
//            <ColorPicker picker={picker} />
//            <hr></hr>
//        </div>
//    );
//}

export const ConfigPage: React.FC<Props> = (props) => {
    if (!props.open) return null

    return (
        <div className={'flex flex-col'}>
            <div className="mb-2">Edit Client Config:</div>
            {Object.entries(DEFAULT_CONFIG).map(([key, value]) => {
                if (typeof value === 'string') return <ConfigStringElement configKey={key} key={key} />
                if (typeof value === 'boolean') return <ConfigBooleanElement configKey={key} key={key} />
                if (typeof value === 'number') return <ConfigNumberElement configKey={key} key={key} />
            })}
            <div><br></br></div>
            <div className="color-pickers">Customize Colors:</div>
            <ColorPicker name={Colors.GAMEAREA_BACKGROUND} />
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
                checked={value}
                onChange={(e) => {
                    context.setState((prevState) => ({
                        ...prevState,
                        config: { ...context.state.config, [configKey]: e.target.checked }
                    }))
                    localStorage.setItem('config' + configKey, JSON.stringify(e.target.checked))
                    // hopefully after the setState is done
                    setTimeout(() => GameRenderer.render(), 10)
                }}
            />
            <div className={'ml-2 text-xs'}>{configDescription[configKey] ?? configKey}

            </div>
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
