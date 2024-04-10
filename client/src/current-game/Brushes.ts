import { schema } from 'battlecode-schema'
import {
    MapEditorBrush,
    MapEditorBrushField,
    MapEditorBrushFieldType,
    SymmetricMapEditorBrush
} from '../components/sidebar/map-editor/MapEditorBrush'
import Bodies, { BODY_DEFINITIONS } from './Bodies'
import { CurrentMap, StaticMap } from './Map'

const applyInRadius = (
    map: CurrentMap | StaticMap,
    x: number,
    y: number,
    radius: number,
    func: (idx: number) => void
) => {
    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            if (Math.sqrt(i * i + j * j) <= radius) {
                const target_x = x + i
                const target_y = y + j
                if (target_x >= 0 && target_x < map.width && target_y >= 0 && target_y < map.height) {
                    const target_idx = map.locationToIndex(target_x, target_y)
                    func(target_idx)
                }
            }
        }
    }
}

export class WallsBrush extends SymmetricMapEditorBrush<CurrentMap> {
    public readonly name = 'Walls'
    public readonly fields = {
        should_add: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        },
        radius: {
            type: MapEditorBrushFieldType.POSITIVE_INTEGER,
            value: 1,
            label: 'Radius'
        }
    }

    constructor(map: CurrentMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const radius: number = fields.radius.value - 1
        applyInRadius(this.map, x, y, radius, (idx) => {
            const { x, y } = this.map.indexToLocation(idx)
            if (this.map.staticMap.spawnLocations.find((l) => l.x == x && l.y == y)) return
            this.map.staticMap.walls[idx] = fields.should_add.value ? 1 : 0
            if (fields.should_add.value) {
                this.map.staticMap.initialWater[idx] = 0
                this.map.water[idx] = 0
            }
        })
    }
}

export class DividerBrush extends SymmetricMapEditorBrush<StaticMap> {
    public readonly name = 'Dam'
    public readonly fields = {
        should_add: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        },
        radius: {
            type: MapEditorBrushFieldType.POSITIVE_INTEGER,
            value: 1,
            label: 'Radius'
        }
    }

    constructor(map: StaticMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const radius: number = fields.radius.value - 1
        applyInRadius(this.map, x, y, radius, (idx) => {
            const { x, y } = this.map.indexToLocation(idx)
            if (this.map.spawnLocations.find((l) => l.x == x && l.y == y)) return
            this.map.divider[idx] = fields.should_add.value ? 1 : 0
        })
    }
}

export class SpawnZoneBrush extends SymmetricMapEditorBrush<CurrentMap> {
    public readonly name = 'Spawn Zones'
    public readonly fields = {
        should_add: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        }
    }

    constructor(map: CurrentMap) {
        super(map)
    }

    // Also add flags for visual purposes even though they don't get serialized
    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const spawnLocs = this.map.staticMap.spawnLocations
        const flagData = this.map.flagData
        const foundIdx = spawnLocs.findIndex((l) => l.x == x && l.y == y)
        const schemaIdx = this.map.locationToIndex(x, y)
        const team = spawnLocs.length % 2

        if (fields.should_add.value) {
            if (foundIdx != -1) return
            flagData.set(schemaIdx, { id: schemaIdx, team, location: { x, y }, carrierId: null })
            spawnLocs.push({ x, y })
            this.map.water[this.map.locationToIndex(x, y)] = 0
            this.map.staticMap.initialWater[this.map.locationToIndex(x, y)] = 0
            this.map.staticMap.walls[this.map.locationToIndex(x, y)] = 0
            this.map.staticMap.divider[this.map.locationToIndex(x, y)] = 0
        }

        if (foundIdx == -1) return
        flagData.delete(schemaIdx)
        for (let i = foundIdx; i < spawnLocs.length - 1; i++) {
            spawnLocs[i] = spawnLocs[i + 1]
        }
        spawnLocs.pop()
    }
}

export class WaterBrush extends SymmetricMapEditorBrush<CurrentMap> {
    public readonly name = 'Water'
    public readonly fields = {
        should_add: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        },
        radius: {
            type: MapEditorBrushFieldType.POSITIVE_INTEGER,
            value: 1,
            label: 'Radius'
        }
    }

    constructor(map: CurrentMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const radius: number = fields.radius.value - 1
        applyInRadius(this.map, x, y, radius, (idx) => {
            const { x, y } = this.map.indexToLocation(idx)
            if (this.map.staticMap.spawnLocations.find((l) => l.x == x && l.y == y)) return
            const add = fields.should_add.value && this.map.staticMap.walls[idx] == 0
            this.map.water[idx] = add ? 1 : 0
            this.map.staticMap.initialWater[idx] = add ? 1 : 0
        })
    }
}

export class ResourcePileBrush extends SymmetricMapEditorBrush<CurrentMap> {
    public readonly name = 'Crumbs'
    public readonly fields = {
        should_add: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        },
        amount: {
            type: MapEditorBrushFieldType.SINGLE_SELECT,
            options: [
                { value: 100, label: '100' },
                { value: 200, label: '200' },
                { value: 300, label: '300' }
            ],
            label: 'Amount',
            value: 100
        }
    }
    constructor(map: CurrentMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const foundIdx = this.map.staticMap.resourcePileLocations.findIndex((l) => l.x == x && l.y == y)
        const schemaIdx = this.map.locationToIndex(x, y)

        if (fields.should_add.value) {
            if (foundIdx != -1) return
            this.map.resourcePileData.set(schemaIdx, { amount: fields.amount.value })
            this.map.staticMap.resourcePileLocations.push({ x, y })
            return
        }

        if (foundIdx == -1) return
        for (let i = foundIdx; i < this.map.staticMap.resourcePileLocations.length - 1; i++)
            this.map.staticMap.resourcePileLocations[i] = this.map.staticMap.resourcePileLocations[i + 1]
        this.map.staticMap.resourcePileLocations.pop()
        this.map.resourcePileData.delete(schemaIdx)
    }
}

// export class TestTrapBrush extends SymmetricMapEditorBrush<CurrentMap> {
//     public readonly name = 'Traps'
//     public readonly fields = {
//         should_add: {
//             type: MapEditorBrushFieldType.ADD_REMOVE,
//             value: true
//         },
//         type: {
//             type: MapEditorBrushFieldType.SINGLE_SELECT,
//             options: [
//                 { value: schema.BuildActionType.EXPLOSIVE_TRAP, label: 'Explosive' },
//                 { value: schema.BuildActionType.WATER_TRAP, label: 'Water' },
//                 { value: schema.BuildActionType.STUN_TRAP, label: 'Stun' }
//             ],
//             label: 'Type',
//             value: schema.BuildActionType.EXPLOSIVE_TRAP
//         }
//     }
//     constructor(map: CurrentMap) {
//         super(map)
//     }

//     public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
//         const schemaIdx = this.map.locationToIndex(x, y)
//         const found = this.map.trapData.get(schemaIdx)

//         if (fields.should_add.value) {
//             if (found) return
//             this.map.trapData.set(schemaIdx, {
//                 location: { x, y },
//                 type: fields.type.value,
//                 team: this.map.trapData.size % 2
//             })
//             return
//         }

//         if (!found) return
//         this.map.trapData.delete(schemaIdx)
//     }
// }

// export class TestDuckBrush extends MapEditorBrush {
//     public readonly name = 'Ducks'
//     public readonly fields = {
//         is_duck: {
//             type: MapEditorBrushFieldType.ADD_REMOVE,
//             value: true
//         },
//         team: {
//             type: MapEditorBrushFieldType.TEAM,
//             value: 0
//         },
//         heal_level: {
//             type: MapEditorBrushFieldType.SINGLE_SELECT,
//             options: [
//                 { value: 0, label: '0' },
//                 { value: 1, label: '1' },
//                 { value: 2, label: '2' },
//                 { value: 3, label: '3' },
//                 { value: 4, label: '4' },
//                 { value: 5, label: '5' },
//                 { value: 6, label: '6' }
//             ],
//             value: 1
//         },
//         attack_level: {
//             type: MapEditorBrushFieldType.SINGLE_SELECT,
//             options: [
//                 { value: 0, label: '0' },
//                 { value: 1, label: '1' },
//                 { value: 2, label: '2' },
//                 { value: 3, label: '3' },
//                 { value: 4, label: '4' },
//                 { value: 5, label: '5' },
//                 { value: 6, label: '6' }
//             ],
//             value: 2
//         },
//         build_level: {
//             type: MapEditorBrushFieldType.SINGLE_SELECT,
//             options: [
//                 { value: 0, label: '0' },
//                 { value: 1, label: '1' },
//                 { value: 2, label: '2' },
//                 { value: 3, label: '3' },
//                 { value: 4, label: '4' },
//                 { value: 5, label: '5' },
//                 { value: 6, label: '6' }
//             ],
//             value: 5
//         }
//     }

//     constructor(private readonly bodies: Bodies, private readonly map: StaticMap) {
//         super()
//     }

//     public apply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
//         const is_duck: boolean = fields.is_duck.value
//         if (is_duck) {
//             if (this.bodies.getBodyAtLocation(x, y)) return
//             const duckClass = BODY_DEFINITIONS[0]
//             const duck = new duckClass(
//                 { x, y },
//                 1,
//                 this.bodies.game.teams[fields.team.value],
//                 this.bodies.getNextID(),
//                 fields.heal_level.value,
//                 fields.attack_level.value,
//                 fields.build_level.value
//             )
//             this.bodies.bodies.set(duck.id, duck)
//         } else {
//             let duck = this.bodies.getBodyAtLocation(x, y, undefined)
//             if (duck) {
//                 this.bodies.bodies.delete(duck.id)
//             }
//         }
//     }
// }
