export const GAME_VERSION = '3.0.6'
export const SPEC_VERSION = '3.0.6'
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

export const ENGINE_BUILTIN_MAP_NAMES: string[] = ['DefaultSmall', 'DefaultMedium', 'DefaultLarge', 'DefaultHuge']

/*
 * Color constants (defined in tailwind.config.js as well)
 */
export const TEAM_0 = '#cdcdcc'
export const TEAM_1 = '#fee493'
export const TEAM_COLORS = [TEAM_0, TEAM_1]
export const TEAM_COLOR_NAMES = ['Silver', 'Gold']

export const PAINT_COLORS = ['#00000000', '#666666', '#4c4c4c', '#998957', '#7f7148']
export const WALLS_COLOR = '#547f31'
export const DIVIDER_COLOR = '#7b4724'
export const TILE_COLOR = '#4c301e'
export const GAMEAREA_BACKGROUND = '#332319'
export const SIDEBAR_BACKGROUND = '#3f3131'

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
