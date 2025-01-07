export enum Colors {
    TEAM_ONE = 'TEAM_ONE',   //'#8648d9'
    TEAM_TWO = 'TEAM_TWO',   //'#ffadcd'

    PAINT_TEAMONE_ONE = 'PAINT_TEAMONE_ONE',    //'#1d4f6c'
    PAINT_TEAMONE_TWO = 'PAINT_TEAMONE_TWO',
    PAINT_TEAMTWO_ONE = 'PAINT_TEAMTWO_ONE',
    PAINT_TEAMTWO_TWO = 'PAINT_TEAMTWO_TWO',
    WALLS_COLOR = 'WALLS_COLOR',    //'#3B6B4C'
    RUINS_COLOR = 'RUINS_COLOR', // '#153e30'
    GAMEAREA_BACKGROUND = 'GAMEAREA_BACKGROUND',    //'#313847'

    ATTACK_COLOR = 'ATTACK_COLOR',  //'#db6b5c'
    BUILD_COLOR = 'BUILD_COLOR',   //'#c573c9'
    HEAL_COLOR = 'HEAL_COLOR',    //'#f2b804'
}

export const DEFAULT_GLOBAL_COLORS = {
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
    [Colors.HEAL_COLOR]: '#f2b804',
}

export const currentColors: Record<Colors, string> = { ...DEFAULT_GLOBAL_COLORS }

export const updateGlobalColor = (color: Colors, value: string) => {
    currentColors[color] = value
    localStorage.setItem('config-colors' + color, JSON.stringify(currentColors[color]))
}

export const getGlobalColor = (color: Colors) => {
    return currentColors[color]
}

export const resetGlobalColors = () => {
    for (const key in currentColors) {
        //console.log("Hello. =^-w-^=")
        updateGlobalColor(key as Colors, DEFAULT_GLOBAL_COLORS[key as Colors])
        
    }
}