import React from 'react'
import GameRunner from './GameRunner'
import { TILE_RESOLUTION } from '../constants'
import { Vector } from './Vector'
import assert from 'assert'
import { GameConfig } from '../app-context'

export enum CanvasLayers {
    Background,
    Dynamic,
    Overlay
}

class GameRendererClass {
    private canvases: Record<CanvasLayers, HTMLCanvasElement>
    private mouseTile?: Vector = undefined
    private mouseDown: boolean = false
    private mouseDownRight: boolean = false
    private selectedBodyID?: number = undefined
    private selectedTile?: Vector = undefined

    private _canvasEventListeners: (() => void)[] = []

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

    render() {
        const ctx = this.ctx(CanvasLayers.Dynamic)
        const overlayCtx = this.ctx(CanvasLayers.Overlay)
        const match = GameRunner.match
        if (!match || !ctx || !overlayCtx) return

        const currentTurn = match.currentTurn
        const map = currentTurn.map

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
        map.draw(match, ctx, GameConfig.config, this.selectedBodyID, this.mouseTile)
        currentTurn.bodies.draw(match, ctx, overlayCtx, GameConfig.config, this.selectedBodyID, this.mouseTile)
        currentTurn.actions.draw(match, ctx)
    }

    fullRender() {
        const ctx = this.ctx(CanvasLayers.Background)
        const match = GameRunner.match
        if (!match || !ctx) return
        match.currentTurn.map.staticMap.draw(ctx)
        this.render()
    }

    onMatchChange() {
        const match = GameRunner.match
        if (!match) return
        const { width, height } = match.currentTurn.map
        this.updateCanvasDimensions({ x: width, y: height })
        this.selectedTile = undefined
        this.mouseTile = undefined
        this.selectedBodyID = undefined
        this.fullRender()
    }

    private updateCanvasDimensions(dims: Vector) {
        for (const canvas of Object.values(this.canvases)) {
            canvas.width = dims.x * TILE_RESOLUTION
            canvas.height = dims.y * TILE_RESOLUTION
            canvas.getContext('2d')?.scale(TILE_RESOLUTION, TILE_RESOLUTION)
        }
    }

    private canvasMouseDown(e: MouseEvent) {
        this.mouseDown = true
        if (e.button === 2) this.mouseDownRight = true
        this._trigger(this._canvasEventListeners)
    }
    private canvasMouseUp(e: MouseEvent) {
        this.mouseDown = false
        if (e.button === 2) this.mouseDownRight = false
        this._trigger(this._canvasEventListeners)
    }
    private canvasMouseMove(e: MouseEvent) {
        const newTile = eventToPoint(e)
        if (newTile.x !== this.mouseTile?.x || newTile.y !== this.mouseTile?.y) {
            this.mouseTile = newTile
            this.render()
            this._trigger(this._canvasEventListeners)
        }
    }
    private canvasMouseLeave(e: MouseEvent) {
        this.mouseDown = false
        this.mouseDownRight = false
        this.mouseTile = undefined
        this._trigger(this._canvasEventListeners)
    }
    private canvasMouseEnter(e: MouseEvent) {
        this.mouseTile = eventToPoint(e)
        this.mouseDown = e.buttons > 0
        if (e.buttons === 2) this.mouseDownRight = true
        this._trigger(this._canvasEventListeners)
    }
    private canvasClick(e: MouseEvent) {
        this.selectedTile = eventToPoint(e)
        const newSelectedBody = GameRunner.match?.currentTurn.bodies.getBodyAtLocation(
            this.selectedTile.x,
            this.selectedTile.y
        )?.id
        if (newSelectedBody !== this.selectedBodyID) {
            this.selectedBodyID = newSelectedBody
            this.render()
        }
        this._trigger(this._canvasEventListeners)
    }

    private _trigger(listeners: (() => void)[]) {
        setTimeout(() => listeners.forEach((l) => l()))
    }

    useCanvasEvents = () => {
        const [canvasMouseDown, setCanvasMouseDown] = React.useState<boolean>(this.mouseDown)
        const [canvasRightClick, setCanvasRightClick] = React.useState<boolean>(this.mouseDownRight)
        const [selectedTile, setSelectedTile] = React.useState<Vector | undefined>(this.selectedTile)
        const [selectedBodyID, setSelectedBodyID] = React.useState<number | undefined>(this.selectedBodyID)
        const [hoveredTile, setHoveredTile] = React.useState<Vector | undefined>(this.mouseTile)
        React.useEffect(() => {
            const listener = () => {
                setCanvasMouseDown(this.mouseDown)
                setCanvasRightClick(this.mouseDownRight)
                setSelectedTile(this.selectedTile)
                setSelectedBodyID(this.selectedBodyID)
                setHoveredTile(this.mouseTile)
            }
            this._canvasEventListeners.push(listener)
            return () => {
                this._canvasEventListeners = this._canvasEventListeners.filter((l) => l !== listener)
            }
        }, [])

        return { canvasMouseDown, canvasRightClick, selectedTile, selectedBodyID, hoveredTile }
    }
}

const eventToPoint = (e: MouseEvent) => {
    const canvas = e.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const map = GameRunner.match?.map ?? assert.fail('map is null in onclick')
    let x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
    let y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * map.height)
    x = Math.max(0, Math.min(x, map.width - 1))
    y = Math.max(0, Math.min(y, map.height - 1))
    return { x: x, y: y }
}

export const GameRenderer = new GameRendererClass()
