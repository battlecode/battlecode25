import { flatbuffers, schema } from 'battlecode-schema'
import assert from 'assert'
import Game, { Team } from './Game'
import Turn from './Turn'
import TurnStat from './TurnStat'
import { getImageIfLoaded } from '../util/ImageLoader'
import * as renderUtils from '../util/RenderUtil'
import { MapEditorBrush } from '../components/sidebar/map-editor/MapEditorBrush'
import { StaticMap } from './Map'
import { Vector } from './Vector'
import {
    ATTACK_COLOR,
    BUILD_COLOR,
    HEAL_COLOR,
    INDICATOR_DOT_SIZE,
    INDICATOR_LINE_WIDTH,
    TOOLTIP_PATH_DECAY_OPACITY,
    TOOLTIP_PATH_DECAY_R,
    TOOLTIP_PATH_INIT_R,
    TOOLTIP_PATH_LENGTH
} from '../constants'
import Match from './Match'
import { ClientConfig } from '../client-config'

export default class Bodies {
    public bodies: Map<number, Body> = new Map()

    constructor(
        public readonly game: Game,
        initialBodies?: schema.SpawnedBodyTable,
        initialStats?: TurnStat,
        mapToVerify?: StaticMap
    ) {
        if (initialBodies) this.insertBodies(initialBodies, initialStats)

        if (mapToVerify) {
            for (let i = 0; i < mapToVerify.width * mapToVerify.height; i++) {
                if (mapToVerify.walls[i] || mapToVerify.divider[i] || mapToVerify.initialWater[i]) {
                    for (const body of this.bodies.values()) {
                        if (body.pos.x == i % mapToVerify.width && body.pos.y == Math.floor(i / mapToVerify.width)) {
                            assert.fail(
                                `Body at (${body.pos.x}, ${body.pos.y}) is on top of a wall or divider or water`
                            )
                        }
                    }
                }
            }
        }
    }

    updateBodyPositions(delta: schema.Round, allowNullBodies: boolean) {
        const movedLocs = delta.robotLocs()
        if (!movedLocs) return
        const movedIds = delta.robotIdsArray() ?? assert.fail('movedIDsArray not found in round')
        const xsArray = movedLocs.xsArray() ?? assert.fail('movedLocs.xsArray not found in round')
        const ysArray = movedLocs.ysArray() ?? assert.fail('movedLocs.ysArray not found in round')
        for (let i = 0; i < delta.robotIdsLength(); i++) {
            const id = movedIds[i]
            const body = this.bodies.get(id)

            assert(allowNullBodies || !!body, `Moved body ${id} not found in bodies`)

            if (body) body.moveTo({ x: xsArray[i], y: ysArray[i] })
        }
    }

    /**
     * Applies a delta to the bodies array. Because of update order, bodies will first
     * be inserted, followed by a call to scopedCallback() in which all bodies are valid.
     */
    applyDelta(turn: Turn, delta: schema.Round, nextDelta: schema.Round | null): void {
        for (const body of this.bodies.values()) if (body.dead) body.jailed = true
        //this.bodies.delete(body.id) in most games

        const bodies = delta.spawnedBodies()
        if (bodies) this.insertBodies(bodies, turn.stat.completed ? undefined : turn.stat)

        // Update positions with respect to interpolation. The first call to update will set the body's
        // target location to the value in delta. This is important when the body eventually gets removed
        // because it should still interpolate to its final position. The second call to update will set the
        // target position to the body's true next position iff it exists. In this case, we allow null
        // bodies and skip them since they may not exist in the next turn. Most of the updates here are extra
        // since the first call is really only necessary for bodies that die, so there is potential for
        // optimization.
        this.updateBodyPositions(delta, false)
        for (const [id, body] of this.bodies) if (!body.jailed) body.addToPrevSquares()
        if (nextDelta) {
            this.updateBodyPositions(nextDelta, true)
        }

        // Update bytecode counters
        for (let i = 0; i < delta.bytecodeIdsLength(); i++) {
            const id = delta.bytecodeIds(i)!
            if (!this.hasId(id)) continue // Not spawned in yet (unique to this game)
            this.getById(id).bytecodesUsed = delta.bytecodesUsed(i)!
        }

        assert(
            delta.robotIdsLength() == delta.healLevelsLength() &&
                delta.robotIdsLength() == delta.attackLevelsLength() &&
                delta.robotIdsLength() == delta.buildLevelsLength() &&
                delta.robotIdsLength() == delta.healsPerformedLength() &&
                delta.robotIdsLength() == delta.attacksPerformedLength() &&
                delta.robotIdsLength() == delta.buildsPerformedLength() &&
                delta.robotIdsLength() == delta.robotHealthsLength(),
            'Delta arrays are not the same length'
        )

        // Update robot properties
        for (let i = 0; i < delta.robotIdsLength(); i++) {
            const id = delta.robotIds(i)!
            const body = this.getById(id)
            body.healLevel = delta.healLevels(i)!
            body.attackLevel = delta.attackLevels(i)!
            body.buildLevel = delta.buildLevels(i)!
            body.healsPerformed = delta.healsPerformed(i)!
            body.attacksPerformed = delta.attacksPerformed(i)!
            body.buildsPerformed = delta.buildsPerformed(i)!
            body.moveCooldown = delta.robotMoveCooldowns(i)!
            body.actionCooldown = delta.robotActionCooldowns(i)!
            body.hp = delta.robotHealths(i)!
        }

        // Flag died robots
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

        // Calculate some stats that do not need to recalculate every turn if they have
        // not already been calculated
        if (!turn.stat.completed) {
            turn.stat.getTeamStat(this.game.teams[0]).specializationTotalLevels = [0, 0, 0, 0, 0]
            turn.stat.getTeamStat(this.game.teams[1]).specializationTotalLevels = [0, 0, 0, 0, 0]
            turn.stat.getTeamStat(this.game.teams[0]).robots = [0, 0, 0, 0, 0]
            turn.stat.getTeamStat(this.game.teams[1]).robots = [0, 0, 0, 0, 0]
            for (const body of this.bodies.values()) {
                const teamStat = turn.stat.getTeamStat(body.team)
                if (body.dead || body.jailed) {
                    teamStat.robots[4] += 1
                    teamStat.specializationTotalLevels[4] += (body.healLevel + body.buildLevel + body.attackLevel) / 3
                } else {
                    teamStat.robots[body.getSpecialization().idx] += 1
                    teamStat.specializationTotalLevels[1] += body.attackLevel
                    teamStat.specializationTotalLevels[2] += body.buildLevel
                    teamStat.specializationTotalLevels[3] += body.healLevel
                }
            }
        }

        // Clear existing indicators
        for (const body of this.bodies.values()) {
            body.indicatorDots = []
            body.indicatorLines = []
            body.indicatorString = ''
        }

        // Add new indicator dots
        const locs = delta.indicatorDotLocs() ?? assert.fail(`Delta missing indicatorDotLocs`)
        const dotColors = delta.indicatorDotRgbs() ?? assert.fail(`Delta missing indicatorDotRgbs`)
        for (let i = 0; i < locs.xsLength(); i++) {
            const bodyId = delta.indicatorDotIds(i)!
            // Check if exists because technically can add indicators when not spawned
            if (!this.hasId(bodyId)) continue
            const body = this.getById(bodyId)
            body.indicatorDots.push({
                location: { x: locs.xs(i)!, y: locs.ys(i)! },
                color: renderUtils.rgbToHex(dotColors.red(i)!, dotColors.green(i)!, dotColors.blue(i)!)
            })
        }

        // Add new indicator lines
        const starts = delta.indicatorLineStartLocs() ?? assert.fail(`Delta missing indicatorLineStarts`)
        const ends = delta.indicatorLineEndLocs() ?? assert.fail(`Delta missing indicatorLineEnds`)
        const lineColors = delta.indicatorLineRgbs() ?? assert.fail(`Delta missing indicatorLineRgbs`)
        for (let i = 0; i < starts.xsLength(); i++) {
            const bodyId = delta.indicatorLineIds(i)!
            // Check if exists because technically can add indicators when not spawned
            if (!this.hasId(bodyId)) continue
            const body = this.getById(bodyId)
            body.indicatorLines.push({
                start: { x: starts.xs(i)!, y: starts.ys(i)! },
                end: { x: ends.xs(i)!, y: ends.ys(i)! },
                color: renderUtils.rgbToHex(lineColors.red(i)!, lineColors.green(i)!, lineColors.blue(i)!)
            })
        }

        // Add new indicator strings
        for (let i = 0; i < delta.indicatorStringIdsLength(); i++) {
            const bodyId = delta.indicatorStringIds(i)!
            // Check if exists because technically can add indicators when not spawned
            if (!this.hasId(bodyId)) continue
            const body = this.getById(bodyId)
            const string = delta.indicatorStrings(i)
            body.indicatorString = string
        }
    }

    private insertBodies(bodies: schema.SpawnedBodyTable, stat?: TurnStat): void {
        const teams = bodies.teamIdsArray() ?? assert.fail('Initial body teams not found in header')
        const locs = bodies.locs() ?? assert.fail('Initial body locations not found in header')
        const xsArray = locs.xsArray() ?? assert.fail('Initial body x locations not found in header')
        const ysArray = locs.ysArray() ?? assert.fail('Initial body y locations not found in header')
        const idsArray = bodies.robotIdsArray() ?? assert.fail('Initial body IDs not found in header')
        assert(
            teams.length == xsArray.length && xsArray.length == ysArray.length && ysArray.length == idsArray.length,
            'Initial body arrays are not the same length'
        )

        for (let i = 0; i < bodies.robotIdsLength(); i++) {
            const id = idsArray[i]
            const bodyClass = BODY_DEFINITIONS[0] ?? assert.fail(`Body type ${0} not found in BODY_DEFINITIONS`)
            const health = this.game.playable ? this.game.constants.robotBaseHealth() : 1

            if (this.bodies.has(id)) {
                //respawn jailed body
                const body = this.bodies.get(id) ?? assert.fail(`Body with id ${id} not found in bodies`)
                assert(body.jailed && body.dead, `Body with id ${id} is not jailed or dead`)
                body.hp = health
                body.jailed = false
                body.dead = false
                body.resetPos({ x: xsArray[i], y: ysArray[i] })
            } else {
                this.bodies.set(
                    id,
                    new bodyClass(
                        this.game,
                        { x: xsArray[i], y: ysArray[i] },
                        health,
                        this.game.getTeamByID(teams[i]),
                        id
                    )
                )
            }
            if (stat) {
                const newBody =
                    this.bodies.get(id) ?? assert.fail(`Body with id ${id} should have been added to bodies`)
                const teamStat =
                    stat.getTeamStat(this.game.getTeamByID(teams[i])) ??
                    assert.fail(`team ${i} not found in team stats in turn`)
                // make team stat modifications based on types here (not really used for this game)
            }
        }
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
        hoveredBodyID?: number
    ): void {
        for (const body of this.bodies.values())
            if (!body.jailed)
                body.draw(match, ctx, overlayCtx, config, body.id === selectedBodyID, body.id === hoveredBodyID)
    }

    getNextID(): number {
        return Math.max(-1, ...this.bodies.keys()) + 1
    }

    getBodyAtLocation(x: number, y: number, team?: Team): Body | undefined {
        let found_dead_body: Body | undefined = undefined
        for (const body of this.bodies.values()) {
            if ((!team || body.team === team) && body.pos.x === x && body.pos.y === y) {
                if (body.jailed) continue
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
        return []
    }

    toSpawnedBodyTable(builder: flatbuffers.Builder): number {
        const robotIDs: Uint8Array = new Uint8Array(this.bodies.size)
        const teamIDs: Uint8Array = new Uint8Array(this.bodies.size)
        const xs: Uint8Array = new Uint8Array(this.bodies.size)
        const ys: Uint8Array = new Uint8Array(this.bodies.size)

        Array.from(this.bodies.values()).forEach((body, i) => {
            robotIDs[i] = body.id
            teamIDs[i] = body.team.id
            xs[i] = body.pos.x
            ys[i] = body.pos.y
        })

        const robotIDsVector = schema.SpawnedBodyTable.createRobotIdsVector(builder, robotIDs)
        const teamIDsVector = schema.SpawnedBodyTable.createTeamIdsVector(builder, teamIDs)

        const xsTable = schema.VecTable.createXsVector(builder, xs)
        const ysTable = schema.VecTable.createYsVector(builder, ys)
        schema.VecTable.startVecTable(builder)
        schema.VecTable.addXs(builder, xsTable)
        schema.VecTable.addYs(builder, ysTable)
        const locsVecTable = schema.VecTable.endVecTable(builder)

        schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
        schema.SpawnedBodyTable.addRobotIds(builder, robotIDsVector)
        schema.SpawnedBodyTable.addTeamIds(builder, teamIDsVector)
        schema.SpawnedBodyTable.addLocs(builder, locsVecTable)
        return schema.SpawnedBodyTable.endSpawnedBodyTable(builder)
    }
}

export class Body {
    public robotName: string = ''
    public actionRadius: number = 0
    public visionRadius: number = 0
    protected imgPath: string = ''
    public nextPos: Vector
    private prevSquares: Vector[]
    public indicatorDots: { location: Vector; color: string }[] = []
    public indicatorLines: { start: Vector; end: Vector; color: string }[] = []
    public indicatorString: string = ''
    public dead: boolean = false
    public jailed: boolean = false
    public moveCooldown: number = 0
    public actionCooldown: number = 0
    constructor(
        private game: Game,
        public pos: Vector,
        public hp: number,
        public readonly team: Team,
        public readonly id: number,
        public carryingFlagId: number | null = null,
        public healLevel: number = 0,
        public attackLevel: number = 0,
        public buildLevel: number = 0,
        public healsPerformed: number = 0,
        public attacksPerformed: number = 0,
        public buildsPerformed: number = 0,
        public bytecodesUsed: number = 0
    ) {
        this.nextPos = this.pos
        this.prevSquares = [this.pos]
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
        const renderCoords = renderUtils.getRenderCoords(pos.x, pos.y, match.currentTurn.map.staticMap.dimension)
        if (this.dead) ctx.globalAlpha = 0.5
        renderUtils.renderCenteredImageOrLoadingIndicator(
            ctx,
            getImageIfLoaded(this.imgPath),
            renderCoords,
            this.carryingFlagId !== null ? 1.1 : 1
        )
        ctx.globalAlpha = 1

        if (selected || hovered) this.drawPath(match, overlayCtx)
        if (selected || hovered || config.showAllRobotRadii) this.drawRadii(match, overlayCtx, !selected)
        if (selected || hovered || config.showAllIndicators)
            this.drawIndicators(match, overlayCtx, !selected && !config.showAllIndicators)
        if (selected || hovered || config.showHealthBars) this.drawHealthBar(match, overlayCtx)

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

    private drawRadii(match: Match, ctx: CanvasRenderingContext2D, lightly: boolean) {
        const pos = this.getInterpolatedCoords(match)
        if (lightly) ctx.globalAlpha = 0.5
        const renderCoords = renderUtils.getRenderCoords(pos.x, pos.y, match.currentTurn.map.staticMap.dimension)
        ctx.beginPath()
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 0.1
        ctx.arc(renderCoords.x + 0.5, renderCoords.y + 0.5, Math.sqrt(this.actionRadius), 0, 360)
        ctx.stroke()

        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 0.1
        ctx.arc(renderCoords.x + 0.5, renderCoords.y + 0.5, Math.sqrt(this.visionRadius), 0, 360)
        ctx.stroke()
        ctx.globalAlpha = 1
    }

    private drawIndicators(match: Match, ctx: CanvasRenderingContext2D, lighter: boolean): void {
        const dimension = match.currentTurn.map.staticMap.dimension
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
        const dimension = match.currentTurn.map.staticMap.dimension
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
        const maxHP = this.game.constants.robotBaseHealth()
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
            this.carryingFlagId !== null ? `Has Flag! (ID: ${this.carryingFlagId})` : '',
            `Attack Lvl: ${this.attackLevel} (${this.attacksPerformed} exp)`,
            `Build Lvl: ${this.buildLevel} (${this.buildsPerformed} exp)`,
            `Heal Lvl: ${this.healLevel} (${this.healsPerformed} exp)`,
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

    public getSpecialization(): { idx: number; name: string } {
        assert(this.attackLevel >= 0 && this.attackLevel <= 6, 'Attack level out of bounds')
        assert(this.healLevel >= 0 && this.healLevel <= 6, 'Heal level out of bounds')
        assert(this.buildLevel >= 0 && this.buildLevel <= 6, 'Build level out of bounds')
        // assert([this.attackLevel, this.healLevel, this.buildLevel].sort()[1] <= 3, 'Specialization level too high')
        if (this.attackLevel > 3) return { idx: 1, name: 'attack' }
        if (this.buildLevel > 3) return { idx: 2, name: 'build' }
        if (this.healLevel > 3) return { idx: 3, name: 'heal' }
        return { idx: 0, name: 'base' }
    }
}

export const BODY_DEFINITIONS: Record<number, typeof Body> = {
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

    0: class Duck extends Body {
        public robotName = 'Duck'

        constructor(game: Game, pos: Vector, hp: number, team: Team, id: number) {
            super(game, pos, hp, team, id)
            this.actionRadius = game.constants.actionRadius()
            this.visionRadius = game.constants.visionRadius()

            this.robotName = `${team.colorName} Duck`
        }

        public draw(
            match: Match,
            ctx: CanvasRenderingContext2D,
            overlayCtx: CanvasRenderingContext2D,
            config: ClientConfig,
            selected: boolean,
            hovered: boolean
        ): void {
            this.imgPath = `robots/${this.team.colorName.toLowerCase()}/${this.getSpecialization().name}_64x64.png`
            super.draw(match, ctx, overlayCtx, config, selected, hovered)

            const levelIndicators: [string, number, [number, number]][] = [
                [ATTACK_COLOR, this.attackLevel, [0.8, -0.5]],
                [BUILD_COLOR, this.buildLevel, [0.5, -0.8]],
                [HEAL_COLOR, this.healLevel, [0.2, -0.2]]
            ]
            const interpCoords = this.getInterpolatedCoords(match)
            for (const [color, level, [dx, dy]] of levelIndicators) {
                this.drawPetals(match, ctx, color, level, interpCoords.x + dx, interpCoords.y + dy)
            }
        }

        private drawPetals(
            match: Match,
            ctx: CanvasRenderingContext2D,
            color: string,
            level: number,
            x: number,
            y: number
        ): void {
            if (level == 0) return
            const drawCoords = renderUtils.getRenderCoords(x, y, match.currentTurn.map.staticMap.dimension)

            ctx.fillStyle = color
            ctx.strokeStyle = 'black'
            ctx.beginPath()
            ctx.moveTo(drawCoords.x, drawCoords.y)
            for (let i = 0; i < level; i++) {
                const petalWidthRads = (2 * Math.PI) / 12
                const angle = i * petalWidthRads * 2
                const petalLength = 0.15
                ctx.bezierCurveTo(
                    drawCoords.x + ((petalLength * 1) / 3) * Math.cos(angle - petalWidthRads * 2.5),
                    drawCoords.y + ((petalLength * 1) / 3) * Math.sin(angle - petalWidthRads * 2.5),
                    drawCoords.x + ((petalLength * 2) / 3) * Math.cos(angle - (petalWidthRads * 2.5) / 2),
                    drawCoords.y + ((petalLength * 2) / 3) * Math.sin(angle - (petalWidthRads * 2.5) / 2),
                    drawCoords.x + petalLength * Math.cos(angle),
                    drawCoords.y + petalLength * Math.sin(angle)
                )
                ctx.bezierCurveTo(
                    drawCoords.x + ((petalLength * 2) / 3) * Math.cos(angle + (petalWidthRads * 2.5) / 2),
                    drawCoords.y + ((petalLength * 2) / 3) * Math.sin(angle + (petalWidthRads * 2.5) / 2),
                    drawCoords.x + ((petalLength * 1) / 3) * Math.cos(angle + petalWidthRads * 2.5),
                    drawCoords.y + ((petalLength * 1) / 3) * Math.sin(angle + petalWidthRads * 2.5),
                    drawCoords.x,
                    drawCoords.y
                )
            }
            ctx.lineWidth = 0.05
            ctx.globalAlpha = 0.5
            ctx.stroke()
            ctx.globalAlpha = 0.75
            ctx.fill()
            ctx.globalAlpha = 1
        }
    }
}
