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

export class WallsBrush extends SymmetricMapEditorBrush<StaticMap> {
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

    constructor(map: StaticMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
        const radius: number = fields.radius.value - 1
        applyInRadius(this.map, x, y, radius, (idx) => {
            this.map.walls[idx] = fields.should_add.value ? 1 : 0
            if (fields.should_add.value) {
                this.map.initialPaint[idx] = 0
                // this.map.paint[idx] = 0
            }
        })
        
        /*
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
        */
    }
}

export class RuinsBrush extends SymmetricMapEditorBrush<StaticMap> {
    public readonly name = 'Ruins'
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
        // const radius: number = fields.radius.value - 1
        // applyInRadius(this.map, x, y, radius, (idx) => {
        //     const { x, y } = this.map.indexToLocation(idx)
        //     this.map.ruins.push({x, y})
        // })
        const foundIdx = this.map.ruins.findIndex((l) => l.x == x && l.y == y)
        const schemaIdx = this.map.locationToIndex(x, y)

        if (fields.should_add.value) {
            if (foundIdx != -1) return
            // this.map.resourcePileData.set(schemaIdx, { amount: fields.amount.value })
            this.map.ruins.push({ x, y })
            return
        }

        if (foundIdx == -1) return
        for (let i = foundIdx; i < this.map.ruins.length - 1; i++)
            this.map.ruins[i] = this.map.ruins[i + 1]
        this.map.ruins.pop()
        // this.map.resourcePileData.delete(schemaIdx)
    }
}

// export class SpawnZoneBrush extends SymmetricMapEditorBrush<CurrentMap> {
//     public readonly name = 'Spawn Zones'
//     public readonly fields = {
//         should_add: {
//             type: MapEditorBrushFieldType.ADD_REMOVE,
//             value: true
//         }
//     }

//     constructor(map: CurrentMap) {
//         super(map)
//     }

//     // Also add flags for visual purposes even though they don't get serialized
//     public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
//         /*
//         const spawnLocs = this.map.staticMap.spawnLocations
//         const flagData = this.map.flagData
//         const foundIdx = spawnLocs.findIndex((l) => l.x == x && l.y == y)
//         const schemaIdx = this.map.locationToIndex(x, y)
//         const team = spawnLocs.length % 2

//         if (fields.should_add.value) {
//             if (foundIdx != -1) return
//             flagData.set(schemaIdx, { id: schemaIdx, team, location: { x, y }, carrierId: null })
//             spawnLocs.push({ x, y })
//             this.map.water[this.map.locationToIndex(x, y)] = 0
//             this.map.staticMap.initialWater[this.map.locationToIndex(x, y)] = 0
//             this.map.staticMap.walls[this.map.locationToIndex(x, y)] = 0
//             this.map.staticMap.divider[this.map.locationToIndex(x, y)] = 0
//         }

//         if (foundIdx == -1) return
//         flagData.delete(schemaIdx)
//         for (let i = foundIdx; i < spawnLocs.length - 1; i++) {
//             spawnLocs[i] = spawnLocs[i + 1]
//         }
//         spawnLocs.pop()
//         */
//     }
// }

export class PaintBrush extends SymmetricMapEditorBrush<CurrentMap> {
    public readonly name = 'Paint'
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
        applyInRadius(this.map, x, y, radius, (idx)=> {
            const add = fields.should_add.value && this.map.staticMap.walls[idx] == 0
            this.map.paint[idx] = add ? 1: 0
            this.map.staticMap.initialPaint[idx] = add ? 1: 0
        })
        /*
        const radius: number = fields.radius.value - 1
        applyInRadius(this.map, x, y, radius, (idx) => {
            const { x, y } = this.map.indexToLocation(idx)
            if (this.map.staticMap.spawnLocations.find((l) => l.x == x && l.y == y)) return
            const add = fields.should_add.value && this.map.staticMap.walls[idx] == 0
            this.map.water[idx] = add ? 1 : 0
            this.map.staticMap.initialWater[idx] = add ? 1 : 0
        })
        */
    }
}

// export class ResourcePileBrush extends SymmetricMapEditorBrush<CurrentMap> {
//     public readonly name = 'Crumbs'
//     public readonly fields = {
//         should_add: {
//             type: MapEditorBrushFieldType.ADD_REMOVE,
//             value: true
//         },
//         amount: {
//             type: MapEditorBrushFieldType.SINGLE_SELECT,
//             options: [
//                 { value: 100, label: '100' },
//                 { value: 200, label: '200' },
//                 { value: 300, label: '300' }
//             ],
//             label: 'Amount',
//             value: 100
//         }
//     }
//     constructor(map: CurrentMap) {
//         super(map)
//     }

//     public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>) {
//         /*
//         const foundIdx = this.map.staticMap.resourcePileLocations.findIndex((l) => l.x == x && l.y == y)
//         const schemaIdx = this.map.locationToIndex(x, y)

//         if (fields.should_add.value) {
//             if (foundIdx != -1) return
//             this.map.resourcePileData.set(schemaIdx, { amount: fields.amount.value })
//             this.map.staticMap.resourcePileLocations.push({ x, y })
//             return
//         }

//         if (foundIdx == -1) return
//         for (let i = foundIdx; i < this.map.staticMap.resourcePileLocations.length - 1; i++)
//             this.map.staticMap.resourcePileLocations[i] = this.map.staticMap.resourcePileLocations[i + 1]
//         this.map.staticMap.resourcePileLocations.pop()
//         this.map.resourcePileData.delete(schemaIdx)
//         */
//     }
// }

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

export class TowerBrush extends SymmetricMapEditorBrush<StaticMap> {
    public readonly name = 'Towers'
    public readonly fields = {
        is_tower: {
            type: MapEditorBrushFieldType.ADD_REMOVE,
            value: true
        },
        team: {
            type: MapEditorBrushFieldType.TEAM,
            value: 0
        },
        tower_type: {
            type: MapEditorBrushFieldType.SINGLE_SELECT,
            value: schema.RobotType.DEFENSE_TOWER,
            options: [
                {value: schema.RobotType.DEFENSE_TOWER, label: "Defense Tower"},
                {value: schema.RobotType.MONEY_TOWER, label: "Money Tower"},
                {value: schema.RobotType.PAINT_TOWER, label: "Paint Tower"}
            ]
        }
    }

    constructor(private readonly bodies: Bodies, map: StaticMap) {
        super(map)
    }

    public symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>, robotOne: boolean) {
        const is_tower: boolean = fields.is_tower.value
        const towerType = fields.tower_type.value
        if (is_tower) {
            if (this.bodies.getBodyAtLocation(x, y)) return
            const team = robotOne ? 0 : 1;
            const towerClass = BODY_DEFINITIONS[towerType as keyof typeof BODY_DEFINITIONS]
            const tower = new towerClass(
                this.bodies.game,
                { x, y },
                this.bodies.game.teams[team],
                this.bodies.getNextID(),
            )
            this.bodies.bodies.set(tower.id, tower)
        } else {
            let tower = this.bodies.getBodyAtLocation(x, y, undefined)
            if (tower) {
                this.bodies.bodies.delete(tower.id)
            }
        }
    }
}
