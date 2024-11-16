import { schema, flatbuffers } from 'battlecode-schema'
import Game from '../../../playback/Game'
import Match from '../../../playback/Match'
import { CurrentMap, StaticMap } from '../../../playback/Map'
import Round from '../../../playback/Round'
import Bodies from '../../../playback/Bodies'
import { BATTLECODE_YEAR, DIRECTIONS } from '../../../constants'
import { nativeAPI } from '../runner/native-api-wrapper'

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
    const mapError = verifyMapGuarantees(round)
    if (mapError) return mapError

    round.map.staticMap.name = name

    const data = mapToFile(round.map, round.bodies)
    exportFile(data, name + `.map${BATTLECODE_YEAR % 100}`)

    return ''
}

function verifyMapGuarantees(round: Round) {
    const staticMap = round.map.staticMap

    throw new Error('Not implemented')

    /*
    if (round.map.isEmpty() && round.bodies.isEmpty()) {
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
                if (x < 0 || x >= round.map.width || y < 0 || y >= round.map.height) continue
                const mapIdx = round.map.locationToIndex(x, y)
                if (!round.map.water[mapIdx] && !staticMap.walls[mapIdx] && !staticMap.divider[mapIdx]) {
                    totalSpawnableLocations++
                }
            }
        }
    }
    if (totalSpawnableLocations < 9 * 3 * 2) {
        return `Map has ${totalSpawnableLocations} spawnable locations. Must have 9 * 3 for each team`
    }

    for (let zoneIdx = 0; zoneIdx < staticMap.spawnLocations.length; zoneIdx += 2) {
        const floodMask = new Int8Array(round.map.width * round.map.height)
        const floodQueue: number[] = []
        const spawnZone = staticMap.spawnLocations[zoneIdx]
        const startIdx = round.map.locationToIndex(spawnZone.x, spawnZone.y)
        floodMask[startIdx] = 1
        floodQueue.push(startIdx)
        let totalFlooded = 1
        while (floodQueue.length > 0) {
            const idx = floodQueue.shift()!
            for (let i = 1; i < 9; i++) {
                const x = DIRECTIONS[i][0] + round.map.indexToLocation(idx).x
                const y = DIRECTIONS[i][1] + round.map.indexToLocation(idx).y
                if (x < 0 || x >= round.map.width || y < 0 || y >= round.map.height) continue
                const newIdx = round.map.locationToIndex(x, y)
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
        if (totalFlooded >= 0.5 * round.map.width * round.map.height) {
            return `Map is too open. Must be divided into at least 2 sections by the dam`
        }
    }
*/

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
