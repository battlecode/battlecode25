import { GameRenderer } from './playback/GameRenderer'

/*
 * TODO: colors are defined in tailwind.config.js as well
 */

export enum Colors {
    TEAM_ONE = 'TEAM_ONE', //'#8648d9'
    TEAM_TWO = 'TEAM_TWO', //'#ffadcd'

    PAINT_TEAMONE_ONE = 'PAINT_TEAMONE_ONE', //'#1d4f6c'
    PAINT_TEAMONE_TWO = 'PAINT_TEAMONE_TWO',
    PAINT_TEAMTWO_ONE = 'PAINT_TEAMTWO_ONE',
    PAINT_TEAMTWO_TWO = 'PAINT_TEAMTWO_TWO',
    WALLS_COLOR = 'WALLS_COLOR', //'#3B6B4C'
    GAMEAREA_BACKGROUND = 'GAMEAREA_BACKGROUND', //'#313847'
    TILE_COLOR = 'TILE_COLOR',
    SIDEBAR_BACKGROUND = 'SIDEBAR_BACKGROUND'
}

export const DEFAULT_GLOBAL_COLORS = {
    [Colors.TEAM_ONE]: '#cdcdcc',
    [Colors.TEAM_TWO]: '#fee493',

    [Colors.PAINT_TEAMONE_ONE]: '#666666',
    [Colors.PAINT_TEAMONE_TWO]: '#565656',
    [Colors.PAINT_TEAMTWO_ONE]: '#b28b52',
    [Colors.PAINT_TEAMTWO_TWO]: '#997746',
    [Colors.WALLS_COLOR]: '#547f31',
    [Colors.TILE_COLOR]: '#4c301e',
    [Colors.GAMEAREA_BACKGROUND]: '#2e2323',
    [Colors.SIDEBAR_BACKGROUND]: '#3f3131'
}

export const currentColors: Record<Colors, string> = { ...DEFAULT_GLOBAL_COLORS }

export const updateGlobalColor = (color: Colors, value: string) => {
    currentColors[color] = value
    localStorage.setItem('config-colors' + color, JSON.stringify(currentColors[color]))
    GameRenderer.fullRender()
}

export const getGlobalColor = (color: Colors) => {
    return currentColors[color]
}

export const resetGlobalColors = () => {
    for (const key in currentColors) {
        const typedKey = key as Colors
        updateGlobalColor(typedKey, DEFAULT_GLOBAL_COLORS[typedKey])
    }
}

export const getPaintColors = () => {
    return [
        '#00000000',
        currentColors.PAINT_TEAMONE_ONE,
        currentColors.PAINT_TEAMONE_TWO,
        currentColors.PAINT_TEAMTWO_ONE,
        currentColors.PAINT_TEAMTWO_TWO
    ]
}

export const getTeamColors = () => {
    return [currentColors.TEAM_ONE, currentColors.TEAM_TWO]
}
