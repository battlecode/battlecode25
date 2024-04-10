import * as cst from '../current-game/Constants'
import { Team } from '../current-game/Game'
import { CurrentMap, Dimension, StaticMap } from '../current-game/Map'
import { Vector } from './vector'
import { Body } from '../current-game/Bodies'

export const getRenderCoords = (cellX: number, cellY: number, dims: Dimension, centered: boolean = false) => {
    const cx = dims.minCorner.x + cellX
    const cy = dims.minCorner.y + dims.height - cellY - 1 // Y is flipped
    const offset = centered ? 0.5 : 0
    return { x: cx + offset, y: cy + offset }
}

export const getInterpolatedCoordsFromBody = (body: Body, alpha: number) => {
    return getInterpolatedCoords(body.pos, body.nextPos, alpha)
}

export const getInterpolatedCoords = (prev: Vector, cur: Vector, alpha: number) => {
    return {
        x: prev.x * (1 - alpha) + cur.x * alpha,
        y: prev.y * (1 - alpha) + cur.y * alpha
    }
}

export const get9SliceClipPath = (
    i: number,
    j: number,
    map: StaticMap | CurrentMap,
    vals: number[] | Int8Array | Int32Array,
    outsideMerge: { x: boolean; y: boolean } = { x: false, y: false },
    valFunc: (v: number | boolean) => boolean = (v) => (v ? true : false)
): number[][] => {
    let edge = 0.07
    let bevel = 0.13
    let neighbors: boolean[] = []
    for (let v = 1; v < 9; v++) {
        let x = cst.DIRECTIONS[v][0] + i
        let y = cst.DIRECTIONS[v][1] + j
        let pushVal =
            x < 0 || x == map.width
                ? outsideMerge.x
                : y < 0 || y == map.height
                ? outsideMerge.y
                : valFunc(vals[map.locationToIndex(x, y)])
        neighbors.push(pushVal)
    }
    let points: number[][] = []
    let corners: Record<number, { cx: number; cy: number; sx: number; sy: number }> = {
        0: { cx: 0, cy: 1, sx: 1, sy: -1 },
        1: { cx: 1, cy: 1, sx: -1, sy: -1 },
        2: { cx: 1, cy: 0, sx: -1, sy: 1 },
        3: { cx: 0, cy: 0, sx: 1, sy: 1 }
    }
    for (let corner = 0; corner < 4; corner++) {
        let cl = corner * 2
        let cc = corner * 2 + 1
        let cr = (corner * 2 + 2) % 8

        let { cx, cy, sx, sy } = corners[corner]

        if (neighbors[cl] || neighbors[cr]) {
            if (neighbors[cl] && neighbors[cr]) {
                if (neighbors[cc]) {
                    points.push([cx, cy])
                } else {
                    if (corner % 2 == 1) points.push([cx + sx * edge, cy])
                    points.push([cx, cy + sy * edge])
                    if (corner % 2 == 0) points.push([cx + sx * edge, cy])
                }
            } else if (neighbors[cr]) points.push(corner % 2 == 0 ? [cx + sx * edge, cy] : [cx, cy + sy * edge])
            else if (neighbors[cl]) points.push(corner % 2 == 1 ? [cx + sx * edge, cy] : [cx, cy + sy * edge])
        } else {
            if (corner % 2 == 0) points.push([cx + sx * edge, cy + sy * bevel])
            points.push([cx + sx * bevel, cy + sy * edge])
            if (corner % 2 == 1) points.push([cx + sx * edge, cy + sy * bevel])
        }
    }
    return points
}

export const applyClip = (
    ctx: CanvasRenderingContext2D,
    i: number,
    j: number,
    path: number[][],
    render: () => void
) => {
    ctx.save()
    ctx.beginPath()
    let started = false
    for (let point of path) {
        if (!started) ctx.moveTo(point[0] + i, point[1] + j)
        else ctx.lineTo(point[0] + i, point[1] + j)
        started = true
    }
    ctx.closePath()
    ctx.clip()
    render()
    ctx.restore()
}

export const renderRounded = (
    ctx: CanvasRenderingContext2D,
    i: number,
    j: number,
    map: CurrentMap | StaticMap,
    values: any[] | Int8Array | Int32Array,
    render: () => void,
    outsideMerge: { x: boolean; y: boolean } = { x: false, y: false },
    valueCheck: (v: number | boolean) => boolean = (v) => !!v
) => {
    const path = get9SliceClipPath(i, j, map, values, outsideMerge, valueCheck)
    const coords = getRenderCoords(i, j, map.dimension)
    applyClip(ctx, coords.x, coords.y, path, () => render())
}

export const applyStyles = (ctx: CanvasRenderingContext2D, styles: Record<string, any>, render: () => void) => {
    const saved: Record<string, any> = {}
    for (const style in styles) {
        saved[style] = (ctx as any)[style]
        ;(ctx as any)[style] = styles[style]
    }
    render()
    for (const style in saved) (ctx as any)[style] = saved[style]
}

export const blendColors = (colorA: string, colorB: string, amount: number) => {
    const [rA, gA, bA] = colorA.match(/\w\w/g)!.map((c) => parseInt(c, 16))
    const [rB, gB, bB] = colorB.match(/\w\w/g)!.map((c) => parseInt(c, 16))
    const r = Math.round(rA + (rB - rA) * amount)
        .toString(16)
        .padStart(2, '0')
    const g = Math.round(gA + (gB - gA) * amount)
        .toString(16)
        .padStart(2, '0')
    const b = Math.round(bA + (bB - bA) * amount)
        .toString(16)
        .padStart(2, '0')
    return '#' + r + g + b
}

export const drawDiagonalLines = (ctx: CanvasRenderingContext2D, coords: Vector, scale: number, color: string) => {
    const x = coords.x * scale
    const y = coords.y * scale
    const d = scale / 8

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + d, y)
    ctx.lineTo(x, y + d)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 3 * d, y)
    ctx.lineTo(x + 5 * d, y)
    ctx.lineTo(x, y + 5 * d)
    ctx.lineTo(x, y + 3 * d)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 7 * d, y)
    ctx.lineTo(x + 8 * d, y)
    ctx.lineTo(x + 8 * d, y + d)
    ctx.lineTo(x + d, y + 8 * d)
    ctx.lineTo(x, y + 8 * d)
    ctx.lineTo(x, y + 7 * d)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 5 * d, y + 8 * d)
    ctx.lineTo(x + 3 * d, y + 8 * d)
    ctx.lineTo(x + 8 * d, y + 3 * d)
    ctx.lineTo(x + 8 * d, y + 5 * d)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 8 * d, y + 8 * d)
    ctx.lineTo(x + 7 * d, y + 8 * d)
    ctx.lineTo(x + 8 * d, y + 7 * d)
    ctx.closePath()
    ctx.fill()
}

export const renderTileArrow = (ctx: CanvasRenderingContext2D, coords: Vector, direction: number) => {
    ctx.beginPath()

    let dir = cst.DIRECTIONS[direction]
    let len = (1 / Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1])) * 0.4
    let x = coords.x + 0.5
    let y = coords.y + 0.5

    ctx.moveTo(x + dir[0] * len, y + dir[1] * len)
    let right = [(-dir[1] * len) / 2, (dir[0] * len) / 2]
    ctx.lineTo(x - dir[0] * len * 0.7 + right[0], y - dir[1] * len * 0.7 + right[1])
    ctx.lineTo(x - dir[0] * len * 0.7 - right[0], y - dir[1] * len * 0.7 - right[1])
    ctx.closePath()
    ctx.fill()
}

interface RenderLineOptions {
    lineWidth?: number
    opacity?: number
    renderArrow?: boolean
    color?: string
    teamForOffset?: Team
}

// Render a centered line from start to end with an optional arrow to indicate direction
export const renderLine = (
    ctx: CanvasRenderingContext2D,
    start: Vector,
    end: Vector,
    options: RenderLineOptions = {}
) => {
    const alpha = ctx.globalAlpha
    const color = ctx.strokeStyle
    ctx.globalAlpha = options.opacity || 1
    ctx.beginPath()

    // Create an offset for the rendered objects such that the lines are centered
    // with a slight offset based on the team (assumes there are two teams) so that
    // both lines are visible if two are rendered at the same point
    let xShift = 0.5
    let yShift = 0.5
    if (options.teamForOffset) {
        xShift += (options.teamForOffset.id - 1.5) * 0.15
        yShift += (options.teamForOffset.id - 1.5) * 0.15
    }

    // Line
    ctx.moveTo(start.x + xShift, start.y + yShift)
    ctx.lineTo(end.x + xShift, end.y + yShift)
    ctx.lineWidth = options.lineWidth || 0.05
    ctx.strokeStyle = options.color || color
    ctx.stroke()

    // Arrow
    if (options.renderArrow) {
        const midX = (start.x + end.x) * 0.5 + xShift
        const midY = (start.y + end.y) * 0.5 + yShift
        let dirVec = { x: end.x - start.x, y: end.y - start.y }
        const dirVecMag = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y)
        dirVec = { x: dirVec.x / dirVecMag, y: dirVec.y / dirVecMag }
        const rightVec = { x: dirVec.y, y: -dirVec.x }
        ctx.moveTo(midX, midY)
        ctx.lineTo(midX + (-dirVec.x - rightVec.x) * 0.1, midY + (-dirVec.y - rightVec.y) * 0.1)
        ctx.stroke()
        ctx.moveTo(midX, midY)
        ctx.lineTo(midX + (-dirVec.x + rightVec.x) * 0.1, midY + (-dirVec.y + rightVec.y) * 0.1)
        ctx.stroke()
    }

    ctx.closePath()
    ctx.strokeStyle = color
    ctx.globalAlpha = alpha
}

// Draws an outline around a tile
export const renderRoundedOutline = (ctx: CanvasRenderingContext2D, coords: Vector, color: string) => {
    ctx.beginPath()
    const r90 = 0.5 * Math.PI
    ctx.moveTo(coords.x + 0.1, coords.y + 0.2)
    ctx.arc(coords.x + 0.2, coords.y + 0.2, 0.1, 2 * r90, 3 * r90)
    ctx.lineTo(coords.x + 0.8, coords.y + 0.1)
    ctx.arc(coords.x + 0.8, coords.y + 0.2, 0.1, 3 * r90, 4 * r90)
    ctx.lineTo(coords.x + 0.9, coords.y + 0.8)
    ctx.arc(coords.x + 0.8, coords.y + 0.8, 0.1, 0, r90)
    ctx.lineTo(coords.x + 0.2, coords.y + 0.9)
    ctx.arc(coords.x + 0.2, coords.y + 0.8, 0.1, r90, 2 * r90)
    ctx.lineTo(coords.x + 0.1, coords.y + 0.2)
    ctx.closePath()
    ctx.strokeStyle = color
    ctx.lineWidth = 0.075
    ctx.stroke()
}

// Draws an image at (x, y) such that it is centered in a SIZE*SIZE grid of cells
export const renderCenteredImage = (
    ctx: CanvasRenderingContext2D,
    img: CanvasImageSource,
    coords: Vector,
    size: number
) => {
    ctx.drawImage(img, coords.x + (1 - size) / 2, coords.y + (1 - size) / 2, size, size)
}

/**
 * Renders the image centerd at the location if image exists, otherwise renders a loading indicator
 */
export const renderCenteredImageOrLoadingIndicator = (
    ctx: CanvasRenderingContext2D,
    img: CanvasImageSource | undefined,
    coords: Vector,
    size: number
) => {
    if (img) {
        renderCenteredImage(ctx, img, coords, size)
    } else {
        ctx.beginPath()
        ctx.arc(coords.x + 0.5, coords.y + 0.5, size / 2.5, 0, 2 * Math.PI)
        ctx.fillStyle = '#0005'
        ctx.fill()
    }
}

export const rgbToHex = (r: number, g: number, b: number) =>
    '#' +
    [r, g, b]
        .map((x) => {
            const hex = x.toString(16)
            return hex.length === 1 ? '0' + hex : hex
        })
        .join('')

export const renderCarets = (overlayCtx: CanvasRenderingContext2D, pos: Vector, direction: Vector, count: number, color: string) => {
    overlayCtx.fillStyle = color
    overlayCtx.beginPath()
    const scale = .4
    overlayCtx.lineCap = 'round'
    overlayCtx.lineWidth = 0.15
    overlayCtx.strokeStyle = color
    const tangent = { x: -direction.y, y: direction.x }
    overlayCtx.moveTo(pos.x + direction.x * (1+scale) + tangent.x * scale, pos.y + direction.y * (1+scale) + tangent.y * scale)
    overlayCtx.lineTo(pos.x + direction.x, pos.y + direction.y)
    overlayCtx.lineTo(pos.x + direction.x * (1+scale) - tangent.x * scale, pos.y + direction.y * (1+scale) - tangent.y * scale)
    overlayCtx.stroke()
    if (count > 1) renderCarets(overlayCtx, { x: pos.x + direction.x, y: pos.y + direction.y }, direction, count - 1, color)
}
