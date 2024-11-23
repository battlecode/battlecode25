export enum Colors {
    TEAM_ONE = 0,   //'#8648d9'
    TEAM_TWO = 1,   //'#ffadcd'

    PAINT_TEAMONE_ONE = 2,    //'#1d4f6c'
    PAINT_TEAMONE_TWO = 3,
    PAINT_TEAMTWO_ONE = 4,
    PAINT_TEAMTWO_TWO = 5,
    WALLS_COLOR = 6,    //'#3B6B4C'
    DIVIDER_COLOR = 7,  //'#7b4724'
    RUINS_COLOR = 8, // '#153e30'
    GAMEAREA_BACKGROUND = 9,    //'#313847'

    ATTACK_COLOR = 10,  //'#db6b5c'
    BUILD_COLOR = 11,   //'#c573c9'
    HEAL_COLOR = 12,    //'#f2b804'
}

export const currentColors: Record<Colors, string> = {
    [Colors.TEAM_ONE]: '#8648d9',
    [Colors.TEAM_TWO]: '#ffadcd',

    [Colors.PAINT_TEAMONE_ONE]: '#1d4f6c',
    [Colors.PAINT_TEAMONE_TWO]: '#ffffff',
    [Colors.PAINT_TEAMTWO_ONE]: '#ffffff',
    [Colors.PAINT_TEAMTWO_TWO]: '#ffffff',
    [Colors.WALLS_COLOR]: '#3B6B4C',
    [Colors.DIVIDER_COLOR]: '#7b4724',
    [Colors.RUINS_COLOR]: '#153e30',
    [Colors.GAMEAREA_BACKGROUND]: '#313847',

    [Colors.ATTACK_COLOR]: '#db6b5c',
    [Colors.BUILD_COLOR]: '#c573c9',
    [Colors.HEAL_COLOR]: '#f2b804',
}

export const updateGlobalColor = (color: Colors, value: string) => {
    currentColors[color] = value
}

export const getGlobalColor = (color: Colors) => {
    return currentColors[color]
}

export const resetGlobalColors = {
    [currentColors[Colors.TEAM_ONE]]: '#8648d9',
    [currentColors[Colors.TEAM_TWO]]: '#ffadcd',

    [currentColors[Colors.PAINT_TEAMONE_ONE]]: '#1d4f6c',
    [currentColors[Colors.PAINT_TEAMONE_TWO]]: '#ffffff',
    [currentColors[Colors.PAINT_TEAMTWO_ONE]]: '#ffffff',
    [currentColors[Colors.PAINT_TEAMTWO_TWO]]: '#ffffff',
    [currentColors[Colors.WALLS_COLOR]]: '#3B6B4C',
    [currentColors[Colors.DIVIDER_COLOR]]: '#7b4724',
    [currentColors[Colors.RUINS_COLOR]]: '#153e30',
    [currentColors[Colors.GAMEAREA_BACKGROUND]]: '#313847',

    [currentColors[Colors.ATTACK_COLOR]]: '#db6b5c',
    [currentColors[Colors.BUILD_COLOR]]: '#c573c9',
    [currentColors[Colors.HEAL_COLOR]]: '#f2b804',
}