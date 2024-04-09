import { schema } from 'battlecode-schema'

export const GAME_VERSION = '3.0.6'
export const SPEC_VERSION = '3.0.6'
export const BATTLECODE_YEAR: number = 2024
export const MAP_SIZE_RANGE = {
    min: 30,
    max: 60
}

/*
 * General constants
 */
export const DIRECTIONS: Record<number, Array<number>> = {
    0: [0, 0],
    1: [-1, 0],
    2: [-1, -1],
    3: [0, -1],
    4: [1, -1],
    5: [1, 0],
    6: [1, 1],
    7: [0, 1],
    8: [-1, 1]
}

export const ENGINE_BUILTIN_MAP_NAMES: string[] = [
    'DefaultSmall',
    'DefaultMedium',
    'DefaultLarge',
    'DefaultHuge',

    'Alligator',
    'Anchor',
    'Battlefield',
    'BreadPudding',
    'Decision',
    'English',
    'Gated',
    'Gauntlet',
    'Hurricane',
    'Islands',
    'Mountain',
    'Occulus',
    'Randy',
    'Skyline',
    'Starfish',
    'StarryNight',
    'Swoop',
    'TwistedTreeline',
    'Valentine',
    'Waterworld',
    'WheresMyWater',

    'Asteroids',
    'Backslash',
    'Capacitance',
    'Digging',
    'EvilGrin',
    'Funnel',
    'GravitationalWaves',
    'Joker',
    'KingQuacksCastle',
    'MIT',
    'OceanFloor',
    'ORV',
    'Pancakes',
    'Puzzle',
    'StackGame',
    'Tunnels',
    'Whirlpool',
    'YearOfTheDragon',

    'BedWars',
    'Bunkers',
    'Checkered',
    'Diagonal',
    'Divergent',
    'EndAround',
    'FloodGates',
    'Foxes',
    'Fusbol',
    'GaltonBoard',
    'HeMustBeFreed',
    'Intercontinental',
    'Klein',
    'QueenOfHearts',
    'QuestionableChess',
    'Racetrack',
    'Rainbow',
    'TreeSearch',

    'AceOfSpades',
    'Alien',
    'Ambush',
    'Battlecode24',
    'BigDucksBigPond',
    'Canals',
    'CH3353C4K3F4CT0RY',
    'Duck',
    'Fountain',
    'Hockey',
    'HungerGames',
    'MazeRunner',
    'Rivers',
    'Snake',
    'Soccer',
    'SteamboatMickey',
    'Yinyang'
]

/*
 * Color constants (defined in tailwind.config.js as well)
 */
export const TEAM_WHITE = '#bfbaa8'
export const TEAM_BROWN = '#9c8362' //'#b99c76'
export const TEAM_COLORS = [TEAM_WHITE, TEAM_BROWN]
export const TEAM_COLOR_NAMES = ['White', 'Brown']

export const WATER_COLOR = '#1d4f6c' // brighter version '#29B0D9'
export const WALLS_COLOR = '#3B6B4C'
export const DIVIDER_COLOR = '#7b4724'
export const GRASS_COLOR = '#153e30' // brighter version '#3CCA6E'
export const GAMEAREA_BACKGROUND = WATER_COLOR

export const ATTACK_COLOR = '#db6b5c'
export const BUILD_COLOR = '#c573c9'
export const HEAL_COLOR = '#f2b804'
export const SPECIALTY_COLORS = [ATTACK_COLOR, BUILD_COLOR, HEAL_COLOR]

export const INDICATOR_DOT_SIZE = 0.2
export const INDICATOR_LINE_WIDTH = 0.1

/*
 * Renderer constants
 */
export const TILE_RESOLUTION: number = 50 // Pixels per axis per tile
export const TOOLTIP_PATH_LENGTH = 8
export const TOOLTIP_PATH_INIT_R = 0.2
export const TOOLTIP_PATH_DECAY_R = 0.9
export const TOOLTIP_PATH_DECAY_OPACITY = 0.95

// Map build types to image filenames
export const BUILD_NAMES: Record<schema.BuildActionType, string> = {
    [schema.BuildActionType.EXPLOSIVE_TRAP]: 'explosive',
    [schema.BuildActionType.WATER_TRAP]: 'water',
    [schema.BuildActionType.STUN_TRAP]: 'stun',
    [schema.BuildActionType.DIG]: '',
    [schema.BuildActionType.FILL]: ''
}
