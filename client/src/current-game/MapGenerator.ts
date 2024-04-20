import { schema, flatbuffers } from 'battlecode-schema'
import Game from './Game'
import Match from './Match'
import { CurrentMap, StaticMap } from './Map'
import Turn from './Turn'
import Bodies from './Bodies'
import { BATTLECODE_YEAR, DIRECTIONS } from './Constants'
import { nativeAPI } from '../components/sidebar/runner/native-api-wrapper'

export function loadFileAsMap(file: File): Promise<Game> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = () => {
            const data = new Uint8Array(reader.result as ArrayBuffer)
            const schema_map = schema.GameMap.getRootAsGameMap(new flatbuffers.ByteBuffer(data))
            const game = new Game()
            const map = StaticMap.fromSchema(schema_map)
            game.currentMatch = Match.fromMap(schema_map, game, map)
            resolve(game)
        }
    })
}

export function exportMap(turn: Turn, name: string) {
    const mapError = verifyMapGuarantees(turn)
    if (mapError) return mapError

    turn.map.staticMap.name = name

    const data = mapToFile(turn.map, turn.bodies)
    exportFile(data, name + `.map${BATTLECODE_YEAR % 100}`)

    return ''
}

function verifyMapGuarantees(turn: Turn) {
    const staticMap = turn.map.staticMap

    if (turn.map.isEmpty() && turn.bodies.isEmpty()) {
        return 'Map is empty'
    }

    const spawnZoneCount = staticMap.spawnLocations.length
    if (spawnZoneCount !== 6) {
        return `Map has ${spawnZoneCount} spawn zones. Must have exactly 6`
    }

    for (let i = 0; i < spawnZoneCount; i++) {
        for (let j = i + 1; j < spawnZoneCount; j++) {
            const distSquared =
                Math.pow(staticMap.spawnLocations[i].x - staticMap.spawnLocations[j].x, 2) +
                Math.pow(staticMap.spawnLocations[i].y - staticMap.spawnLocations[j].y, 2)
            if (distSquared < 36) {
                return `Spawn zones ${i} and ${j} are too close together, they must be at least sqrt(36) units apart (6 tiles)`
            }
        }
    }

    let totalSpawnableLocations = 0
    for (let i = 0; i < spawnZoneCount; i++) {
        const loc = staticMap.spawnLocations[i]
        for (let x = loc.x - 1; x <= loc.x + 1; x++) {
            for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                if (x < 0 || x >= turn.map.width || y < 0 || y >= turn.map.height) continue
                const mapIdx = turn.map.locationToIndex(x, y)
                if (!turn.map.water[mapIdx] && !staticMap.walls[mapIdx] && !staticMap.divider[mapIdx]) {
                    totalSpawnableLocations++
                }
            }
        }
    }
    if (totalSpawnableLocations < 9 * 3 * 2) {
        return `Map has ${totalSpawnableLocations} spawnable locations. Must have 9 * 3 for each team`
    }

    for (let zoneIdx = 0; zoneIdx < staticMap.spawnLocations.length; zoneIdx += 2) {
        const floodMask = new Int8Array(turn.map.width * turn.map.height)
        const floodQueue: number[] = []
        const spawnZone = staticMap.spawnLocations[zoneIdx]
        const startIdx = turn.map.locationToIndex(spawnZone.x, spawnZone.y)
        floodMask[startIdx] = 1
        floodQueue.push(startIdx)
        let totalFlooded = 1
        while (floodQueue.length > 0) {
            const idx = floodQueue.shift()!
            for (let i = 1; i < 9; i++) {
                const x = DIRECTIONS[i][0] + turn.map.indexToLocation(idx).x
                const y = DIRECTIONS[i][1] + turn.map.indexToLocation(idx).y
                if (x < 0 || x >= turn.map.width || y < 0 || y >= turn.map.height) continue
                const newIdx = turn.map.locationToIndex(x, y)
                if (!staticMap.divider[newIdx] && !staticMap.walls[newIdx] && !floodMask[newIdx]) {
                    // Check if we can reach an enemy spawn location
                    for (let j = 0; j < staticMap.spawnLocations.length; j++) {
                        const loc = staticMap.spawnLocations[j]
                        if (loc.x == x && loc.y == y && j % 2 != 0)
                            return `Maps cannot have spawn zones that are initially reachable by both teams`
                    }

                    floodMask[newIdx] = 1
                    floodQueue.push(newIdx)
                    totalFlooded++
                }
            }
        }
        if (totalFlooded >= 0.5 * turn.map.width * turn.map.height) {
            return `Map is too open. Must be divided into at least 2 sections by the dam`
        }
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
    const initialBodiesTable = initialBodies.toSpawnedBodyTable(builder)
    const mapPacket = currentMap.getSchemaPacket(builder)

    schema.GameMap.startGameMap(builder)
    schema.GameMap.addName(builder, name)
    schema.GameMap.addSize(builder, schema.Vec.createVec(builder, currentMap.width, currentMap.height))
    schema.GameMap.addSymmetry(builder, currentMap.staticMap.symmetry)
    schema.GameMap.addBodies(builder, initialBodiesTable)
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
