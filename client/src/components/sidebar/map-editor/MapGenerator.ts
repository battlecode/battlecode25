import { schema, flatbuffers } from 'battlecode-schema'
import Game from '../../../playback/Game'
import Match from '../../../playback/Match'
import { CurrentMap, StaticMap } from '../../../playback/Map'
import Round from '../../../playback/Round'
import Bodies from '../../../playback/Bodies'
import { BATTLECODE_YEAR, DIRECTIONS } from '../../../constants'
import { nativeAPI } from '../runner/native-api-wrapper'
import { Vector } from '../../../playback/Vector'

export function loadFileAsMap(file: File): Promise<Game> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = () => {
            const data = new Uint8Array(reader.result as ArrayBuffer)
            const schemaMap = schema.GameMap.getRootAsGameMap(new flatbuffers.ByteBuffer(data))
            const game = new Game()
            game.currentMatch = Match.fromMap(schemaMap, game)
            resolve(game)
        }
    })
}

export function exportMap(round: Round, name: string) {
    const mapError = verifyMap(round.map, round.bodies)
    if (mapError) return mapError

    round.map.staticMap.name = name

    const data = mapToFile(round.map, round.bodies)
    exportFile(data, name + `.map${BATTLECODE_YEAR % 100}`)

    return ''
}

const squareIntersects = (check: Vector, center: Vector, radius: number) => {
    return (
        check.x >= center.x - radius &&
        check.x <= center.x + radius &&
        check.y >= center.y - radius &&
        check.y <= center.y + radius
    )
}

/**
 * Check that the map is valid and conforms with guarantees.
 * Returns a non-empty string with an error if applicable
 */
function verifyMap(map: CurrentMap, bodies: Bodies): string {
    if (map.isEmpty() && bodies.isEmpty()) {
        return 'Map is empty'
    }

    // Validate map elements
    let numWalls = 0
    let numPaintTowers = 0
    let numMoneyTowers = 0
    const mapSize = map.width * map.height
    for (let i = 0; i < mapSize; i++) {
        const pos = map.indexToLocation(i)
        const wall = map.staticMap.walls[i]
        const ruin = map.staticMap.ruins.find((l) => l.x === pos.x && l.y === pos.y)
        const body = bodies.getBodyAtLocation(pos.x, pos.y)

        if (ruin && wall) {
            return `Ruin and wall overlap at (${pos.x}, ${pos.y})`
        }

        if (ruin && body) {
            return `Robot at (${pos.x}, ${pos.y}) is on top of a ruin`
        }

        if (wall && body) {
            return `Robot at (${pos.x}, ${pos.y}) is on top of a wall`
        }

        if (ruin) {
            // Check distance to nearby ruins
            for (const checkRuin of map.staticMap.ruins) {
                if (checkRuin === ruin) continue

                if (squareIntersects(checkRuin, pos, 4)) {
                    return (
                        `Ruin at (${pos.x}, ${pos.y}) is too close to ruin ` +
                        `at (${checkRuin.x}, ${checkRuin.y}), must be ` +
                        `>= 5 away`
                    )
                }
            }
        }

        if (wall) {
            // Check distance to nearby ruins

            for (const checkRuin of map.staticMap.ruins) {
                if (squareIntersects(checkRuin, pos, 2)) {
                    return (
                        `Wall at (${pos.x}, ${pos.y}) is too close to ruin ` +
                        `at (${checkRuin.x}, ${checkRuin.y}), must be ` +
                        `>= 3 away`
                    )
                }
            }
        }

        numPaintTowers += body && body.robotType === schema.RobotType.PAINT_TOWER ? 1 : 0
        numMoneyTowers += body && body.robotType === schema.RobotType.MONEY_TOWER ? 1 : 0
        numWalls += wall
    }

    // Validate wall percentage
    const maxPercent = 20
    if (numWalls * 100 >= mapSize * maxPercent) {
        const displayPercent = (numWalls / mapSize) * 100
        return `Walls must take up at most ${maxPercent}% of the map, currently is ${displayPercent.toFixed(1)}%`
    }

    // Validate initial bodies
    if (numPaintTowers !== 2) {
        return `Expected exactly 2 paint towers, found ${numPaintTowers}`
    }
    if (numMoneyTowers !== 2) {
        return `Expected exactly 2 money towers, found ${numMoneyTowers}`
    }

    return ''
}

/**
 * The order in which the data is written is important. When we change the schema, this may need to be refactored
 * Only one table or object can be created at once, so we have to create the bodies table first, then start the actual map object
 */
function mapToFile(currentMap: CurrentMap, initialBodies: Bodies): Uint8Array {
    const builder = new flatbuffers.Builder()
    const name = builder.createString(currentMap.staticMap.name)
    const initialBodiesTable = initialBodies.toInitialBodyTable(builder)
    const mapPacket = currentMap.getSchemaPacket(builder)

    schema.GameMap.startGameMap(builder)
    schema.GameMap.addName(builder, name)
    schema.GameMap.addSize(builder, schema.Vec.createVec(builder, currentMap.width, currentMap.height))
    schema.GameMap.addSymmetry(builder, currentMap.staticMap.symmetry)
    schema.GameMap.addInitialBodies(builder, initialBodiesTable)
    schema.GameMap.addRandomSeed(builder, Math.round(Math.random() * 1000))
    currentMap.insertSchemaPacket(builder, mapPacket)

    builder.finish(schema.GameMap.endGameMap(builder))
    return builder.asUint8Array()
}

async function exportFile(data: Uint8Array, fileName: string) {
    if (nativeAPI) {
        nativeAPI.exportMap(Array.from(data), fileName)
    } else {
        const mimeType = 'application/octet-stream'
        const blob = new Blob([data], { type: mimeType })
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.style.display = 'none'
        link.click()
        link.remove()

        setTimeout(function () {
            return window.URL.revokeObjectURL(url)
        }, 30000)
    }
}
