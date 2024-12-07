import { flatbuffers, schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Round from './Round'
import * as renderUtils from '../util/RenderUtil'
import { MapEditorBrush } from '../components/sidebar/map-editor/MapEditorBrush'
import { StaticMap } from './Map'
import { Vector } from './Vector'
import {
    INDICATOR_DOT_SIZE,
    INDICATOR_LINE_WIDTH,
    TOOLTIP_PATH_DECAY_OPACITY,
    TOOLTIP_PATH_DECAY_R,
    TOOLTIP_PATH_INIT_R,
    TOOLTIP_PATH_LENGTH
} from '../constants'
import Match from './Match'
import { ClientConfig } from '../client-config'
import { TowerBrush } from './Brushes'
import { getImageIfLoaded } from '../util/ImageLoader'

export default class Bodies {
    public bodies: Map<number, Body> = new Map()

    constructor(
        public readonly game: Game,
        initialBodies?: schema.InitialBodyTable
    ) {
        if (initialBodies) {
            this.insertInitialBodies(initialBodies)
        }
    }

    prepareForNextRound() {
        for (const body of this.bodies.values()) {
            // Clear existing indicators
            body.indicatorDots = []
            body.indicatorLines = []
            body.indicatorString = ''

            // Remove if dead
            if (body.dead) {
                this.bodies.delete(body.id) // safe
            }
        }
    }

    updateNextPositions(nextDelta: schema.Round) {
        for (let i = 0; i < nextDelta.turnsLength(); i++) {
            const turn = nextDelta.turns(i)!
            const body = this.bodies.get(turn.robotId())

            // Body can be null here since they may have not been spawned for the next turn
            if (!body) return

            body.moveTo({ x: turn.x(), y: turn.y() })
        }
    }

    processDiedIds(delta: schema.Round) {
        for (let i = 0; i < delta.diedIdsLength(); i++) {
            const diedId = delta.diedIds(i)!
            const diedBody = this.bodies.get(diedId)
            if (!diedBody) {
                console.warn(
                    `diedIds: Body with id ${diedId} not found in bodies. This will happen because of a resignation, otherwise it is a bug.`
                )
                continue
            }

            diedBody.dead = true
            // Manually set hp since we don't receive a final delta
            diedBody.hp = 0
        }
    }

    spawnBody(id: number, spawnAction: schema.SpawnAction): Body {
        assert(!this.bodies.has(id), `Trying to spawn body with id ${id} that already exists`)

        const robotType = spawnAction.robotType()
        const bodyClass =
            BODY_DEFINITIONS[robotType] ?? assert.fail(`Body type ${robotType} not found in BODY_DEFINITIONS`)

        const team = spawnAction.team()
        const x = spawnAction.x()
        const y = spawnAction.y()

        const body = new bodyClass(this.game, { x, y }, this.game.getTeamByID(team), id)
        this.bodies.set(id, body)

        // Populate default hp, cooldowns, etc
        body.populateDefaultValues()

        return body
    }

    /**
     * Applies a delta to the bodies array. Because of update order, bodies will first
     * be inserted, followed by a call to scopedCallback() in which all bodies are valid.
     */
    applyTurn(round: Round, turn: schema.Turn): void {
        const body = this.getById(turn.robotId())

        // Update properties
        body.pos = { x: turn.x(), y: turn.y() }
        body.hp = turn.health()
        //body.paint = turn.pain();
        body.moveCooldown = turn.moveCooldown()
        body.actionCooldown = turn.actionCooldown()
        body.bytecodesUsed = turn.bytecodesUsed()
    }

    getById(id: number): Body {
        return this.bodies.get(id) ?? assert.fail(`Body with id ${id} not found in bodies`)
    }

    hasId(id: number): boolean {
        return this.bodies.has(id)
    }

    copy(): Bodies {
        const newBodies = new Bodies(this.game)
        newBodies.bodies = new Map(this.bodies)
        for (const body of this.bodies.values()) {
            newBodies.bodies.set(body.id, body.copy())
        }

        return newBodies
    }

    draw(
        match: Match,
        ctx: CanvasRenderingContext2D,
        overlayCtx: CanvasRenderingContext2D,
        config: ClientConfig,
        selectedBodyID?: number,
        hoveredTile?: Vector
    ): void {
        for (const body of this.bodies.values()) {
            body.draw(
                match,
                ctx,
                overlayCtx,
                config,
                body.id === selectedBodyID,
                body.pos.x === hoveredTile?.x && body.pos.y === hoveredTile?.y
            )
        }
    }

    getNextID(): number {
        return Math.max(-1, ...this.bodies.keys()) + 1
    }

    getBodyAtLocation(x: number, y: number, team?: Team): Body | undefined {
        let found_dead_body: Body | undefined = undefined
        for (const body of this.bodies.values()) {
            if ((!team || body.team === team) && body.pos.x === x && body.pos.y === y) {
                if (body.dead) found_dead_body = body
                else return body
            }
        }
        return found_dead_body
    }

    isEmpty(): boolean {
        return this.bodies.size === 0
    }

    getEditorBrushes(map: StaticMap): MapEditorBrush[] {
        return [new TowerBrush(this, map)]
    }

    toInitialBodyTable(builder: flatbuffers.Builder): number {
        const robotIds = new Int32Array(this.bodies.size)

        Array.from(this.bodies.values()).forEach((body, i) => {
            robotIds[i] = body.id
        })

        const robotIdsVector = schema.InitialBodyTable.createRobotIdsVector(builder, robotIds)

        // Fill out spawn actions
        schema.InitialBodyTable.startSpawnActionsVector(builder, robotIds.length)
        for (let i = 0; i < robotIds.length; i++) {
            const body = this.bodies.get(robotIds[i])!
            schema.SpawnAction.createSpawnAction(builder, body.pos.x, body.pos.y, body.team.id, body.robotType)
        }
        const spawnActionsVector = builder.endVector()

        return schema.InitialBodyTable.createInitialBodyTable(builder, robotIdsVector, spawnActionsVector)
    }

    private insertInitialBodies(bodies: schema.InitialBodyTable): void {
        assert(bodies.robotIdsLength() == bodies.spawnActionsLength(), 'Initial body arrays are not the same length')

        for (let i = 0; i < bodies.robotIdsLength(); i++) {
            const id = bodies.robotIds(i)!
            const spawnAction = bodies.spawnActions(i)!

            this.spawnBody(id, spawnAction)
        }
    }
}

export class Body {
    public robotName: string = ''
    public robotType: schema.RobotType = schema.RobotType.NONE
    protected imgPath: string = ''
    protected size: number = 1
    public nextPos: Vector
    private prevSquares: Vector[]
    public indicatorDots: { location: Vector; color: string }[] = []
    public indicatorLines: { start: Vector; end: Vector; color: string }[] = []
    public indicatorString: string = ''
    public dead: boolean = false
    public hp: number = 0
    public actionRadius: number = 0
    public visionRadius: number = 0
    public moveCooldown: number = 0
    public actionCooldown: number = 0
    public bytecodesUsed: number = 0

    constructor(
        private game: Game,
        public pos: Vector,
        public readonly team: Team,
        public readonly id: number
        // paintLevel
        // upgradeLevel
        // moneyLevel (for money towers)
    ) {
        this.nextPos = this.pos
        this.prevSquares = [this.pos]
    }

    get metadata() {
        return this.game.robotTypeMetadata.get(this.robotType) ?? assert.fail('Robot missing metadata!')
    }

    public draw(
        match: Match,
        ctx: CanvasRenderingContext2D,
        overlayCtx: CanvasRenderingContext2D,
        config: ClientConfig,
        selected: boolean,
        hovered: boolean
    ): void {
        const pos = this.getInterpolatedCoords(match)
        const renderCoords = renderUtils.getRenderCoords(pos.x, pos.y, match.currentRound.map.staticMap.dimension)
        
        if (this.dead) ctx.globalAlpha = 0.5
        renderUtils.renderCenteredImageOrLoadingIndicator(
            ctx,
            getImageIfLoaded(this.imgPath),
            renderCoords,
            this.size
        )
        ctx.globalAlpha = 1

        if (selected || hovered) this.drawPath(match, overlayCtx)
        if (selected || hovered || config.showAllRobotRadii) this.drawRadii(match, overlayCtx, !selected)
        if (selected || hovered || config.showAllIndicators)
            this.drawIndicators(match, overlayCtx, !selected && !config.showAllIndicators)
        if (selected || hovered || config.showHealthBars) this.drawHealthBar(match, overlayCtx)

        /*
        if (this.carryingFlagId !== null) {
            renderUtils.renderCenteredImageOrLoadingIndicator(
                overlayCtx,
                getImageIfLoaded('resources/bread_outline_thick_64x64.png'),
                { x: renderCoords.x, y: renderCoords.y },
                0.6
            )

            if (config.showFlagCarryIndicator) {
                for (const direction of [
                    { x: 0.5, y: 0 },
                    { x: 0, y: 0.5 },
                    { x: -0.5, y: 0 },
                    { x: 0, y: -0.5 }
                ]) {
                    renderUtils.renderCarets(
                        overlayCtx,
                        { x: renderCoords.x + 0.5, y: renderCoords.y + 0.5 },
                        direction,
                        2,
                        this.team.id == 1 ? '#ff0000aa' : '#00ffffaa'
                    )
                }
            }
        }
        */
    }

    private drawPath(match: Match, ctx: CanvasRenderingContext2D) {
        const interpolatedCoords = this.getInterpolatedCoords(match)
        let alphaValue = 1
        let radius = TOOLTIP_PATH_INIT_R
        let lastPos: Vector | undefined = undefined
        const posList = [...this.prevSquares, interpolatedCoords].reverse()
        for (const prevPos of posList) {
            const color = `rgba(255, 255, 255, ${alphaValue})`
            ctx.beginPath()
            ctx.fillStyle = color
            ctx.ellipse(prevPos.x + 0.5, match.map.height - (prevPos.y + 0.5), radius, radius, 0, 0, 360)
            ctx.fill()
            alphaValue *= TOOLTIP_PATH_DECAY_OPACITY
            radius *= TOOLTIP_PATH_DECAY_R
            if (lastPos) {
                ctx.beginPath()
                ctx.strokeStyle = color
                ctx.lineWidth = radius / 2
                ctx.moveTo(lastPos.x + 0.5, match.map.height - (lastPos.y + 0.5))
                ctx.lineTo(prevPos.x + 0.5, match.map.height - (prevPos.y + 0.5))
                ctx.stroke()
            }
            lastPos = prevPos
        }
    }

    private getAllLocationsWithinRadiusSquared(match: Match, location: Vector, radius: number) {
        const ceiledRadius = Math.ceil(Math.sqrt(radius)) + 1
        const minX = Math.max(location.x - ceiledRadius, 0)
        const minY = Math.max(location.y - ceiledRadius, 0)
        const maxX = Math.min(location.x + ceiledRadius, match.map.width - 1)
        const maxY = Math.min(location.y + ceiledRadius, match.map.height - 1)

        const coords: Vector[] = []
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const dx = x - location.x
                const dy = y - location.y
                if (dx * dx + dy * dy <= radius) {
                    coords.push({ x, y })
                }
            }
        }

        return coords
    }

    private drawEdges(match: Match, ctx: CanvasRenderingContext2D, lightly: boolean, squares: Array<Vector>) {
        for (let i = 0; i < squares.length; ++i) {
            const squarePos = squares[i]
            const renderCoords = renderUtils.getRenderCoords(
                squarePos.x,
                squarePos.y,
                match.currentRound.map.staticMap.dimension
            )

            const hasTopNeighbor = squares.some((square) => square.x === squarePos.x && square.y === squarePos.y + 1)
            const hasBottomNeighbor = squares.some((square) => square.x === squarePos.x && square.y === squarePos.y - 1)
            const hasLeftNeighbor = squares.some((square) => square.x === squarePos.x - 1 && square.y === squarePos.y)
            const hasRightNeighbor = squares.some((square) => square.x === squarePos.x + 1 && square.y === squarePos.y)

            ctx.beginPath()

            if (!hasTopNeighbor) {
                ctx.moveTo(renderCoords.x, renderCoords.y)
                ctx.lineTo(renderCoords.x + 1, renderCoords.y)
            }

            if (!hasBottomNeighbor) {
                ctx.moveTo(renderCoords.x, renderCoords.y + 1)
                ctx.lineTo(renderCoords.x + 1, renderCoords.y + 1)
            }

            if (!hasLeftNeighbor) {
                ctx.moveTo(renderCoords.x, renderCoords.y)
                ctx.lineTo(renderCoords.x, renderCoords.y + 1)
            }

            if (!hasRightNeighbor) {
                ctx.moveTo(renderCoords.x + 1, renderCoords.y)
                ctx.lineTo(renderCoords.x + 1, renderCoords.y + 1)
            }

            ctx.stroke()
        }
    }

    private drawRadii(match: Match, ctx: CanvasRenderingContext2D, lightly: boolean) {
        // const pos = this.getInterpolatedCoords(match)
        const pos = this.pos

        if (lightly) ctx.globalAlpha = 0.5
        const squares = this.getAllLocationsWithinRadiusSquared(match, pos, this.actionRadius)
        ctx.beginPath()
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 0.1
        this.drawEdges(match, ctx, lightly, squares)

        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 0.1
        const squares2 = this.getAllLocationsWithinRadiusSquared(match, pos, this.visionRadius)
        this.drawEdges(match, ctx, lightly, squares2)

        ctx.globalAlpha = 1
    }

    private drawIndicators(match: Match, ctx: CanvasRenderingContext2D, lighter: boolean): void {
        const dimension = match.currentRound.map.staticMap.dimension
        // Render indicator dots
        for (const data of this.indicatorDots) {
            ctx.globalAlpha = lighter ? 0.5 : 1
            const coords = renderUtils.getRenderCoords(data.location.x, data.location.y, dimension)
            ctx.beginPath()
            ctx.arc(coords.x + 0.5, coords.y + 0.5, INDICATOR_DOT_SIZE, 0, 2 * Math.PI, false)
            ctx.fillStyle = data.color
            ctx.fill()
            ctx.globalAlpha = 1
        }

        ctx.lineWidth = INDICATOR_LINE_WIDTH
        for (const data of this.indicatorLines) {
            ctx.globalAlpha = lighter ? 0.5 : 1
            const start = renderUtils.getRenderCoords(data.start.x, data.start.y, dimension)
            const end = renderUtils.getRenderCoords(data.end.x, data.end.y, dimension)
            ctx.beginPath()
            ctx.moveTo(start.x + 0.5, start.y + 0.5)
            ctx.lineTo(end.x + 0.5, end.y + 0.5)
            ctx.strokeStyle = data.color
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    }

    private drawHealthBar(match: Match, ctx: CanvasRenderingContext2D): void {
        const dimension = match.currentRound.map.staticMap.dimension
        const interpCoords = this.getInterpolatedCoords(match)
        const renderCoords = renderUtils.getRenderCoords(interpCoords.x, interpCoords.y, dimension)
        const hpBarWidth = 0.8
        const hpBarHeight = 0.1
        const hpBarYOffset = 0.4
        const hpBarX = renderCoords.x + 0.5 - hpBarWidth / 2
        const hpBarY = renderCoords.y + 0.5 + hpBarYOffset
        ctx.fillStyle = 'rgba(0,0,0,.3)'
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)
        ctx.fillStyle = this.team.id == 1 ? 'red' : '#00ffff'
        // TODO: adjust
        const maxHP = this.game.playable ? this.metadata.baseHealth() : 1
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * (this.hp / maxHP), hpBarHeight)
    }

    public getInterpolatedCoords(match: Match): Vector {
        return renderUtils.getInterpolatedCoords(this.pos, this.nextPos, match.getInterpolationFactor())
    }

    public onHoverInfo(): string[] {
        const defaultInfo = [
            (this.dead ? 'JAILED: ' : '') + this.robotName,
            `ID: ${this.id}`,
            `HP: ${this.hp}`,
            `Location: (${this.pos.x}, ${this.pos.y})`,
            //this.carryingFlagId !== null ? `Has Flag! (ID: ${this.carryingFlagId})` : '',
            `Move Cooldown: ${this.moveCooldown}`,
            `Action Cooldown: ${this.actionCooldown}`,
            `Bytecodes Used: ${this.bytecodesUsed}`
        ]
        if (this.indicatorString != '') {
            defaultInfo.push(`Indicator: ${this.indicatorString}`)
        }

        return defaultInfo
    }

    public copy(): Body {
        // Creates a new object using this object's prototype and all its parameters.
        // this is a shallow copy, override this if you need a deep copy
        const newBody = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
        newBody.prevSquares = [...this.prevSquares]
        return newBody
    }

    public moveTo(pos: Vector): void {
        this.pos = this.nextPos
        this.nextPos = pos
    }

    public resetPos(pos: Vector): void {
        this.pos = pos
        this.nextPos = pos
        this.prevSquares = [pos]
    }

    public addToPrevSquares(): void {
        this.prevSquares.push(this.pos)
        if (this.prevSquares.length > TOOLTIP_PATH_LENGTH) {
            this.prevSquares.splice(0, 1)
        }
    }

    public populateDefaultValues(): void {
        const metadata = this.metadata

        this.hp = metadata.baseHealth()
        this.actionCooldown = metadata.actionCooldown()
        this.moveCooldown = metadata.movementCooldown()
        this.visionRadius = metadata.visionRadiusSquared()
        this.actionRadius = metadata.actionRadiusSquared()
    }

    public getSpecialization(): { idx: number; name: string } {
        // TODO: delete this function
        return { idx: 0, name: 'base' }
    }
}

export const BODY_DEFINITIONS: Record<schema.RobotType, typeof Body> = {
    // For future games, this dictionary translate schema values of robot
    // types to their respective class, such as this:
    //
    // [schema.BodyType.HEADQUARTERS]: class Headquarters extends Body {
    // 	public robotName = 'Headquarters'
    // 	public actionRadius = 8
    // 	public visionRadius = 34
    // 	public type = schema.BodyType.HEADQUARTERS
    // 	constructor(pos: Vector, hp: number, team: Team, id: number) {
    // 		super(pos, hp, team, id)
    // 		this.imgPath = `robots/${team.color}_headquarters_smaller.png`
    //	}
    //	onHoverInfo(): string[] {
    // 		return super.onHoverInfo();
    // 	}
    // },
    //
    // This game has no types or headquarters to speak of, so there is only
    // one type pointed to by 0:

    [schema.RobotType.NONE]: class None extends Body {
        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)

            throw new Error("Body type 'NONE' not supported")
        }
    },

    [schema.RobotType.DEFENSE_TOWER]: class DefenseTower extends Body {
        public robotName = 'DefenseTower'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} DefenseTower`
            this.robotType = schema.RobotType.DEFENSE_TOWER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/defense_tower_64x64.png`
            this.size = 2
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    },

    [schema.RobotType.MONEY_TOWER]: class MoneyTower extends Body {
        public robotName = 'MoneyTower'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} MoneyTower`
            this.robotType = schema.RobotType.MONEY_TOWER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/money_tower_64x64.png`
            this.size = 2
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    },

    [schema.RobotType.PAINT_TOWER]: class PaintTower extends Body {
        public robotName = 'PaintTower'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} PaintTower`
            this.robotType = schema.RobotType.PAINT_TOWER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/paint_tower_64x64.png`
            this.size = 2
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    },

    [schema.RobotType.MOPPER]: class Mopper extends Body {
        public robotName = 'Mopper'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} Mopper`
            this.robotType = schema.RobotType.MOPPER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/mopper_64x64.png`
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    },

    [schema.RobotType.SOLDIER]: class Soldier extends Body {
        public robotName = 'Soldier'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} Soldier`
            this.robotType = schema.RobotType.SOLDIER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/soldier_64x64.png`
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    },

    [schema.RobotType.SPLASHER]: class Splasher extends Body {
        public robotName = 'Splasher'

        constructor(game: Game, pos: Vector, team: Team, id: number) {
            super(game, pos, team, id)
            this.robotName = `${team.colorName} Splasher`
            this.robotType = schema.RobotType.SPLASHER
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/splasher_64x64.png`
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const interpCoords = this.getInterpolatedCoords(match)
            // for (const [color, level, [dx, dy]] of levelIndicators) {
            //     this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            // }
        }
    }
}
