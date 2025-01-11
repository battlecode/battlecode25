import React from 'react'
import GameRunner from './GameRunner'
import { TEAM_COLOR_NAMES, TILE_RESOLUTION } from '../constants'
import { Vector } from './Vector'
import assert from 'assert'
import { GameConfig } from '../app-context'
import { loadImage } from '../util/ImageLoader'

export enum CanvasLayers {
    Background,
    Dynamic,
    Overlay
}

class GameRendererClass {
    private canvases: Record<CanvasLayers, HTMLCanvasElement>
    private mouseTile?: Vector = undefined
    private mouseDownStartPos?: Vector = undefined
    private mouseDown: boolean = false
    private mouseDownRight: boolean = false
    private selectedBodyID?: number = undefined
    private selectedTile?: Vector = undefined

    private _canvasHoverListeners: (() => void)[] = []
    private _canvasClickListeners: (() => void)[] = []

    constructor() {
        this.canvases = {} as Record<CanvasLayers, HTMLCanvasElement>
        for (const layer of Object.values(CanvasLayers).filter((value) => typeof value === 'number')) {
            const canvas = document.createElement('canvas')
            canvas.style.position = 'absolute'
            canvas.style.top = '50%'
            canvas.style.left = '50%'
            canvas.style.maxWidth = '100%'
            canvas.style.maxHeight = '100%'
            canvas.style.transform = 'translate(-50%, -50%)'
            canvas.style.zIndex = (Object.values(this.canvases).length + 1).toString()
            this.canvases[layer as CanvasLayers] = canvas
        }

        const topCanvas = Object.values(this.canvases)[Object.values(this.canvases).length - 1]
        topCanvas.onmousedown = (e) => this.canvasMouseDown(e)
        topCanvas.onmouseup = (e) => this.canvasMouseUp(e)
        topCanvas.onmousemove = (e) => this.canvasMouseMove(e)
        topCanvas.onmouseleave = (e) => this.canvasMouseLeave(e)
        topCanvas.onmouseenter = (e) => this.canvasMouseEnter(e)
        topCanvas.onclick = (e) => this.canvasClick(e)
        topCanvas.oncontextmenu = (e) => e.preventDefault()

        // Preload all game images
        loadImage('icons/gears_64x64.png')
        loadImage('icons/hammer_64x64.png')
        loadImage('icons/mop_64x64.png')
        loadImage('ruins/silver.png')
        for (const color of TEAM_COLOR_NAMES) {
            loadImage(`robots/${color.toLowerCase()}/defense_tower_64x64.png`)
            loadImage(`robots/${color.toLowerCase()}/money_tower_64x64.png`)
            loadImage(`robots/${color.toLowerCase()}/paint_tower_64x64.png`)
            loadImage(`robots/${color.toLowerCase()}/soldier_64x64.png`)
            loadImage(`robots/${color.toLowerCase()}/splasher_64x64.png`)
            loadImage(`robots/${color.toLowerCase()}/mopper_64x64.png`)
        }
    }

    clearSelected() {
        this.mouseTile = undefined
        this.selectedTile = undefined
        this.selectedBodyID = undefined
        this.render()
        this._canvasClickListeners.forEach((listener) => listener())
        this._canvasHoverListeners.forEach((listener) => listener())
    }

    setSelectedRobot(id: number | undefined) {
        if (id === this.selectedBodyID) return

        this.selectedBodyID = id
        this.render()
        this._trigger(this._canvasClickListeners)
    }

    addCanvasesToDOM(elem: HTMLDivElement | null) {
        if (!elem) return
        for (const canvas of Object.values(this.canvases)) {
            elem.appendChild(canvas)
        }
    }

    canvas(layer: CanvasLayers): HTMLCanvasElement {
        return this.canvases[layer]
    }

    ctx(layer: CanvasLayers): CanvasRenderingContext2D | null {
        return this.canvas(layer).getContext('2d')
    }

    renderOverlay() {
        const ctx = this.ctx(CanvasLayers.Overlay)
        const match = GameRunner.match
        if (!match || !ctx) return

        const currentRound = match.currentRound

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        currentRound.bodies.draw(match, null, ctx, GameConfig.config, this.selectedBodyID, this.mouseTile)
    }

    render() {
        const ctx = this.ctx(CanvasLayers.Dynamic)
        const overlayCtx = this.ctx(CanvasLayers.Overlay)
        const match = GameRunner.match
        if (!match || !ctx || !overlayCtx) return

        const currentRound = match.currentRound

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
        currentRound.map.draw(match, ctx, GameConfig.config, this.selectedBodyID, this.mouseTile)
        currentRound.bodies.draw(match, ctx, overlayCtx, GameConfig.config, this.selectedBodyID, this.mouseTile)
        currentRound.actions.draw(match, ctx)
    }

    fullRender() {
        const ctx = this.ctx(CanvasLayers.Background)
        const match = GameRunner.match
        if (!match || !ctx) return
        match.currentRound.map.staticMap.draw(ctx)
        this.render()
    }

    onMatchChange() {
        const match = GameRunner.match
        if (!match) return
        const { width, height } = match.currentRound.map
        this.updateCanvasDimensions({ x: width, y: height })
        this.selectedTile = undefined
        this.mouseTile = undefined
        this.selectedBodyID = undefined
        this.fullRender()
    }

    private updateCanvasDimensions(dims: Vector) {
        for (const canvas of Object.values(this.canvases)) {
            // perf issues, prefer config.renderscale
            const dpi = 1 //window.devicePixelRatio ?? 1

            const resolution = TILE_RESOLUTION * dpi * (GameConfig.config.resolutionScale / 100)
            canvas.width = dims.x * resolution
            canvas.height = dims.y * resolution
            canvas.getContext('2d')?.scale(resolution, resolution)
        }
    }

    private canvasMouseDown(e: MouseEvent) {
        this.mouseDown = true
        this.mouseDownStartPos = { x: e.x, y: e.y }
        if (e.button === 2) this.mouseDownRight = true
        this._trigger(this._canvasClickListeners)
    }

    private canvasMouseUp(e: MouseEvent) {
        this.mouseDown = false
        if (e.button === 2) this.mouseDownRight = false
        this._trigger(this._canvasClickListeners)
    }

    private canvasMouseMove(e: MouseEvent) {
        const newTile = eventToPoint(e)
        if (!newTile) return
        if (newTile.x !== this.mouseTile?.x || newTile.y !== this.mouseTile?.y) {
            this.mouseTile = newTile
            this.renderOverlay()
            this._trigger(this._canvasHoverListeners)
        }
    }

    private canvasMouseLeave(e: MouseEvent) {
        // Only trigger if the mouse actually left the canvas, not just lost focus
        const rect = this.canvases[0].getBoundingClientRect()
        if (e.x <= rect.right && e.x >= rect.left && e.y <= rect.bottom && e.y >= rect.top) {
            return
        }

        this.mouseDown = false
        this.mouseDownRight = false
        this.mouseTile = undefined
        this._trigger(this._canvasHoverListeners)
    }

    private canvasMouseEnter(e: MouseEvent) {
        const point = eventToPoint(e)
        if (!point) return
        this.mouseTile = point
        this.mouseDown = e.buttons > 0
        if (e.buttons === 2) this.mouseDownRight = true
        this._trigger(this._canvasHoverListeners)
    }

    private canvasClick(e: MouseEvent) {
        // Don't trigger the click if it moved too far away from the origin
        const maxDist = 25
        if (
            this.mouseDownStartPos &&
            (Math.abs(this.mouseDownStartPos.x - e.x) > maxDist || Math.abs(this.mouseDownStartPos.y - e.y) > maxDist)
        )
            return

        this.selectedTile = eventToPoint(e)

        if (!this.selectedTile) return

        const newSelectedBody = GameRunner.match?.currentRound.bodies.getBodyAtLocation(
            this.selectedTile.x,
            this.selectedTile.y
        )?.id

        this.setSelectedRobot(newSelectedBody)

        // Trigger anyways since clicking should always trigger
        this._trigger(this._canvasClickListeners)
    }

    private _trigger(listeners: (() => void)[]) {
        setTimeout(() => listeners.forEach((l) => l()))
    }

    useCanvasHoverEvents = () => {
        const [hoveredTile, setHoveredTile] = React.useState<Vector | undefined>(this.mouseTile)
        React.useEffect(() => {
            const listener = () => {
                setHoveredTile(this.mouseTile)
            }
            this._canvasHoverListeners.push(listener)
            return () => {
                this._canvasHoverListeners = this._canvasHoverListeners.filter((l) => l !== listener)
            }
        }, [])

        return { hoveredTile }
    }

    useCanvasClickEvents = () => {
        const [canvasMouseDown, setCanvasMouseDown] = React.useState<boolean>(this.mouseDown)
        const [canvasRightClick, setCanvasRightClick] = React.useState<boolean>(this.mouseDownRight)
        const [selectedTile, setSelectedTile] = React.useState<Vector | undefined>(this.selectedTile)
        const [selectedBodyID, setSelectedBodyID] = React.useState<number | undefined>(this.selectedBodyID)
        React.useEffect(() => {
            const listener = () => {
                setCanvasMouseDown(this.mouseDown)
                setCanvasRightClick(this.mouseDownRight)
                setSelectedTile(this.selectedTile)
                setSelectedBodyID(this.selectedBodyID)
            }
            this._canvasClickListeners.push(listener)
            return () => {
                this._canvasClickListeners = this._canvasClickListeners.filter((l) => l !== listener)
            }
        }, [])

        return { canvasMouseDown, canvasRightClick, selectedTile, selectedBodyID }
    }
}

const eventToPoint = (e: MouseEvent): Vector | undefined => {
    const canvas = e.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const map = GameRunner.match?.map
    if (!map) return undefined
    let x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
    let y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * map.height)
    x = Math.max(0, Math.min(x, map.width - 1))
    y = Math.max(0, Math.min(y, map.height - 1))
    return { x, y }
}

export const GameRenderer = new GameRendererClass()
