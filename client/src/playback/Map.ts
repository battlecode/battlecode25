import { flatbuffers, schema } from 'battlecode-schema'
import assert from 'assert'
import { Vector } from './Vector'
import Match from './Match'
import { MapEditorBrush, Symmetry } from '../components/sidebar/map-editor/MapEditorBrush'
import { packVecTable, parseVecTable } from './SchemaHelpers'
import { RuinsBrush, WallsBrush, PaintBrush } from './Brushes'
import { DIVIDER_COLOR, GRASS_COLOR, WALLS_COLOR, PAINT_COLOR, TEAM_COLORS, TEAM_COLOR_NAMES } from '../constants'
import * as renderUtils from '../util/RenderUtil'
import { getImageIfLoaded } from '../util/ImageLoader'
import { ClientConfig } from '../client-config'

export type Dimension = {
    minCorner: Vector
    maxCorner: Vector
    width: number
    height: number
}

/*
type FlagData = {
    id: number
    team: number
    location: Vector
    carrierId: number | null
}
*/

type SchemaPacket = {
    wallsOffset: number
    paintOffset: number
    ruinsOffset: number
}

export class CurrentMap {
    public readonly staticMap: StaticMap
    //public readonly flagData: Map<number, FlagData>
    public readonly paint: Int8Array

    get width(): number {
        return this.dimension.width
    }
    get height(): number {
        return this.dimension.height
    }
    get dimension(): Dimension {
        return this.staticMap.dimension
    }

    constructor(from: StaticMap | CurrentMap) {
        //this.flagData = new Map()
        if (from instanceof StaticMap) {
            // Create current map from static map

            this.staticMap = from
            this.paint = new Int8Array(from.initialPaint)

            /*
            for (let i = 0; i < from.spawnLocations.length; i++) {
                // Assign initial flag data, ids are initial map locations
                const team = i % 2
                const location = from.spawnLocations[i]
                const flagId = this.locationToIndex(location.x, location.y)
                this.flagData.set(flagId, { id: flagId, team, location, carrierId: null })
            }
            */
        } else {
            // Create current map from current map (copy)

            this.staticMap = from.staticMap
            /*
            for (let [key, value] of from.flagData) {
                this.flagData.set(key, { ...value })
            }
            */
            this.paint = new Int8Array(from.paint)
        }
    }

    indexToLocation(index: number): { x: number; y: number } {
        return this.staticMap.indexToLocation(index)
    }

    locationToIndex(x: number, y: number): number {
        return this.staticMap.locationToIndex(x, y)
    }

    applySymmetry(point: Vector): Vector {
        return this.staticMap.applySymmetry(point)
    }

    copy(): CurrentMap {
        return new CurrentMap(this)
    }

    /**
     * Mutates this currentMap to reflect the given turn.
     */
    applyTurnDelta(turn: schema.Turn): void {}

    draw(
        match: Match,
        ctx: CanvasRenderingContext2D,
        config: ClientConfig,
        selectedBodyID?: number,
        hoveredTile?: Vector
    ) {
        const dimension = this.dimension
        for (let i = 0; i < dimension.width; i++) {
            for (let j = 0; j < dimension.height; j++) {
                const schemaIdx = this.locationToIndex(i, j)
                const coords = renderUtils.getRenderCoords(i, j, dimension)

                // Render rounded (clipped) paint
                if (this.paint[schemaIdx]) {
                    renderUtils.renderRounded(
                        ctx,
                        i,
                        j,
                        this,
                        this.paint,
                        () => {
                            ctx.fillStyle = PAINT_COLOR
                            ctx.fillRect(coords.x, coords.y, 1.0, 1.0)
                        },
                        { x: true, y: false }
                    )
                }
            }
        }

        // Render flags
        /*
        for (const flagId of this.flagData.keys()) {
            const data = this.flagData.get(flagId)!
            if (data.carrierId) continue
            const coords = renderUtils.getRenderCoords(data.location.x, data.location.y, this.dimension)
            renderUtils.renderCenteredImageOrLoadingIndicator(
                ctx,
                getImageIfLoaded('resources/bread_outline_64x64.png'),
                coords,
                1
            )
        }

        // Render resource piles
        for (const pileId of this.resourcePileData.keys()) {
            const data = this.resourcePileData.get(pileId)!
            if (data.amount == 0) continue
            const loc = this.indexToLocation(pileId)
            const size = (data.amount / 100) * 0.3 + 0.75
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, this.dimension)
            const crumbVersion = ((loc.x * 37 + loc.y * 19) % 3) + 1
            renderUtils.renderCenteredImageOrLoadingIndicator(
                ctx,
                getImageIfLoaded(`resources/crumb_${crumbVersion}_64x64.png`),
                coords,
                size
            )
        }

        // Render traps
        for (const trapId of this.trapData.keys()) {
            const data = this.trapData.get(trapId)!
            const file = `traps/${BUILD_NAMES[data.type]}_64x64.png`
            const loc = data.location
            const coords = renderUtils.getRenderCoords(loc.x, loc.y, this.dimension)
            renderUtils.renderRoundedOutline(ctx, coords, TEAM_COLORS[data.team - 1])

            ctx.globalAlpha = 0.6
            renderUtils.renderCenteredImageOrLoadingIndicator(ctx, getImageIfLoaded(file), coords, 0.8)
            ctx.globalAlpha = 1
        }
        */
    }

    getTooltipInfo(square: Vector, match: Match): string[] {
        // Bounds check
        if (square.x >= this.width || square.y >= this.height) return []

        const schemaIdx = this.locationToIndex(square.x, square.y)

        const paint = this.paint[schemaIdx]
        const wall = this.staticMap.walls[schemaIdx]
        const ruin = this.staticMap.ruins.find((r) => r.x === square.x && r.y === square.y)

        const info: string[] = []
        for (let i = 0; i < match.game.teams.length; i++) {
            if (paint === i * 2 + 1) {
                info.push(`${TEAM_COLOR_NAMES[i]} Paint (Primary)`)
            } else if (paint === i * 2 + 2) {
                info.push(`${TEAM_COLOR_NAMES[i]} Paint (Secondary)`)
            }
        }
        if (wall) {
            info.push('Wall')
        }
        if (ruin) {
            info.push('Ruin')
        }

        return info
    }

    getEditorBrushes() {
        const brushes: MapEditorBrush[] = [
            // ruins brush
            // tower brush
            new PaintBrush(this),
            new RuinsBrush(this.staticMap),
            new WallsBrush(this.staticMap)
        ]
        return brushes.concat(this.staticMap.getEditorBrushes())
    }

    isEmpty(): boolean {
        return this.paint.every((x) => x == 0) && this.staticMap.isEmpty()
    }

    /**
     * Creates a packet of flatbuffers data which will later be inserted
     * This and the next function are seperated due to how flatbuffers works
     */
    getSchemaPacket(builder: flatbuffers.Builder): SchemaPacket {
        const wallsOffset = schema.GameMap.createWallsVector(
            builder,
            Array.from(this.staticMap.walls).map((x) => !!x)
        )
        const paintOffset = schema.GameMap.createPaintVector(builder, this.staticMap.initialPaint)
        const ruinsOffset = packVecTable(builder, this.staticMap.ruins)

        return {
            wallsOffset,
            paintOffset,
            ruinsOffset
        }
    }

    /**
     * Inserts an existing packet of flatbuffers data into the given builder
     * This and the previous function are seperated due to how flatbuffers works
     */
    insertSchemaPacket(builder: flatbuffers.Builder, packet: SchemaPacket) {
        schema.GameMap.addWalls(builder, packet.wallsOffset)
        schema.GameMap.addPaint(builder, packet.paintOffset)
        schema.GameMap.addRuins(builder, packet.ruinsOffset)
    }
}

export class StaticMap {
    constructor(
        public name: string,
        public readonly randomSeed: number, // I dont know what this is for
        public readonly symmetry: number,
        public readonly dimension: Dimension,
        public readonly walls: Int8Array,
        public readonly ruins: Vector[],
        public readonly initialPaint: Int8Array
    ) {
        if (symmetry < 0 || symmetry > 2 || !Number.isInteger(symmetry)) {
            throw new Error(`Invalid symmetry ${symmetry}`)
        }

        if (walls.length != dimension.width * dimension.height) {
            throw new Error('Invalid walls length')
        }
        if (initialPaint.length != dimension.width * dimension.height) {
            throw new Error('Invalid paint length')
        }

        if (walls.some((x) => x !== 0 && x !== 1)) {
            throw new Error('Invalid walls value')
        }
        if (initialPaint.some((x) => x < 0 || x > 4)) {
            throw new Error('Invalid paint value')
        }
    }

    static fromSchema(schemaMap: schema.GameMap) {
        const name = schemaMap.name() as string
        const randomSeed = schemaMap.randomSeed()
        const symmetry = schemaMap.symmetry()

        const size = schemaMap.size() ?? assert.fail('Map size() is missing')
        const minCorner = { x: 0, y: 0 }
        const maxCorner = { x: size.x(), y: size.y() }
        const dimension = {
            minCorner,
            maxCorner,
            width: maxCorner.x - minCorner.x,
            height: maxCorner.y - minCorner.y
        }

        const walls = schemaMap.wallsArray() ?? assert.fail('wallsArray() is null')
        const ruins = parseVecTable(schemaMap.ruins() ?? assert.fail('ruins() is null'))
        const initialPaint = schemaMap.paintArray() ?? assert.fail('paintArray() is null')
        return new StaticMap(name, randomSeed, symmetry, dimension, walls, ruins, initialPaint)
    }

    static fromParams(width: number, height: number, symmetry: Symmetry) {
        const name = 'Custom Map'
        const randomSeed = 0

        const minCorner = { x: 0, y: 0 }
        const maxCorner = { x: width, y: height }
        const dimension = {
            minCorner,
            maxCorner,
            width: maxCorner.x - minCorner.x,
            height: maxCorner.y - minCorner.y
        }

        const walls = new Int8Array(width * height)
        const ruins: Vector[] = []
        const initialPaint = new Int8Array(width * height)
        return new StaticMap(name, randomSeed, symmetry, dimension, walls, ruins, initialPaint)
    }

    get width(): number {
        return this.dimension.width
    }
    get height(): number {
        return this.dimension.height
    }

    indexToLocation(index: number): { x: number; y: number } {
        const x = index % this.width
        const y = (index - x) / this.width
        assert(x >= 0 && x < this.width, `x=${x} out of bounds for indexToLocation`)
        assert(y >= 0 && y < this.height, `y=${y} out of bounds for indexToLocation`)
        return { x, y }
    }

    locationToIndex(x: number, y: number): number {
        assert(x >= 0 && x < this.width, `x ${x} out of bounds`)
        assert(y >= 0 && y < this.height, `y ${y} out of bounds`)
        return Math.floor(y) * this.width + Math.floor(x)
    }

    /**
     * Returns a point representing the reflection of the given point following the map's symmetry.
     */
    applySymmetry(point: Vector): Vector {
        switch (this.symmetry) {
            case Symmetry.VERTICAL:
                return { x: this.width - point.x - 1, y: point.y }
            case Symmetry.HORIZONTAL:
                return { x: point.x, y: this.height - point.y - 1 }
            case Symmetry.ROTATIONAL:
                return { x: this.width - point.x - 1, y: this.height - point.y - 1 }
            default:
                throw new Error(`Invalid symmetry ${this.symmetry}`)
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Fill background
        ctx.fillStyle = GRASS_COLOR
        ctx.fillRect(
            this.dimension.minCorner.x,
            this.dimension.minCorner.y,
            this.dimension.width,
            this.dimension.height
        )

        for (let i = 0; i < this.dimension.width; i++) {
            for (let j = 0; j < this.dimension.height; j++) {
                const schemaIdx = this.locationToIndex(i, j)
                const coords = renderUtils.getRenderCoords(i, j, this.dimension)

                // Render rounded (clipped) wall
                if (this.walls[schemaIdx]) {
                    renderUtils.renderRounded(ctx, i, j, this, this.walls, () => {
                        ctx.fillStyle = WALLS_COLOR
                        ctx.fillRect(coords.x, coords.y, 1.0, 1.0)
                    })
                }

                /*
                // Render spawn zones
                if (spawnZoneDrawAreas[schemaIdx]) {
                    const color = TEAM_COLORS[spawnZoneDrawAreas[schemaIdx] - 1]
                    renderUtils.renderRounded(ctx, i, j, this, spawnZoneDrawAreas, () => {
                        renderUtils.drawDiagonalLines(ctx, coords, 1.0, color)
                    })
                }
                */

                // Render ruins
                this.ruins.forEach(({ x, y }) => {
                    const coords = renderUtils.getRenderCoords(x, y, this.dimension)

                    const imgPath = `ruins/silver.png`
                    const ruinImage = getImageIfLoaded(imgPath)
                    renderUtils.renderCenteredImageOrLoadingIndicator(ctx, ruinImage, coords, 1.0)
                })

                // Draw grid
                const showGrid = true
                if (showGrid) {
                    const thickness = 0.02
                    renderUtils.applyStyles(
                        ctx,
                        { strokeStyle: 'black', lineWidth: thickness, globalAlpha: 0.1 },
                        () => {
                            ctx.strokeRect(
                                coords.x + thickness / 2,
                                coords.y + thickness / 2,
                                1 - thickness,
                                1 - thickness
                            )
                        }
                    )
                }
            }
        }
    }

    isEmpty(): boolean {
        return this.walls.every((x) => x == 0) && this.ruins.length == 0
    }

    getEditorBrushes(): MapEditorBrush[] {
        return []
    }
}
