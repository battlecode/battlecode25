export const CLIENT_VERSION = '3.0.0'
export const SPEC_VERSION = '1'
export const BATTLECODE_YEAR: number = 2025
export const MAP_SIZE_RANGE = {
    min: 20,
    max: 60
}
export const GAME_MAX_TURNS = 2000
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
    // Default
    'DefaultSmall',
    'DefaultMedium',
    'DefaultLarge',
    'DefaultHuge',

    // Sprint 1
    'Justice',
    'memstore',
    'Mirage',
    'MoneyTower',
    'Restart',
    'Thirds',
    'catface',
    'Fossil',
    'gardenworld',
    'Gears',
    'Money',
    'Racetrack',
    'SaltyPepper',
    'SMILE',
    'TargetPractice',
    'UglySweater',
    'UnderTheSea',

    // Sprint 2
    'giver',
    'galaxy',
    'leavemealone',
    'sayhi',
    'sierpinski',
    'windmill',
    'quack',
    'gridworld',
    'fix',
    'Filter',
    'BunnyGame',
    'Bread',
    'Snowglobe',
    'Barcode',
    'Flower',
    'Piglets2'
]

export const TEAM_COLOR_NAMES = ['Silver', 'Gold']

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
