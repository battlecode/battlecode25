import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../app-context'
import { Vector } from '../../playback/Vector'
import { EventType, publishEvent, useListenEvent } from '../../app-events'
import assert from 'assert'
import { Tooltip } from './tooltip'
import { TILE_RESOLUTION } from '../../constants'
import { CurrentMap } from '../../playback/Map'
import { useMatch, useTurn } from '../../playback/GameRunner'

export const GameRenderer: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const backgroundCanvas = useRef<HTMLCanvasElement | null>(null)
    const dynamicCanvas = useRef<HTMLCanvasElement | null>(null)
    const overlayCanvas = useRef<HTMLCanvasElement | null>(null)

    const appContext = useAppContext()
    const match = useMatch()
    const turn = useTurn()

    const [selectedBodyID, setSelectedBodyID] = useState<number | undefined>(undefined)
    const [hoveredTile, setHoveredTile] = useState<Vector | undefined>(undefined)
    const [selectedSquare, setSelectedSquare] = useState<Vector | undefined>(undefined)
    const [hoveredBodyID, setHoveredBodyID] = useState<number | undefined>(undefined)
    const calculateHoveredBodyID = () => {
        if (!hoveredTile) return setHoveredBodyID(undefined)
        if (!match) return
        const hoveredBodyIDFound = match.currentTurn.bodies.getBodyAtLocation(hoveredTile.x, hoveredTile.y)?.id
        setHoveredBodyID(hoveredBodyIDFound)

        // always clear this so the selection is cleared when you move
        setSelectedSquare(undefined)
    }
    useEffect(calculateHoveredBodyID, [turn?.turnNumber, hoveredTile]) // watch turn number, not turn object because it doesnt change

    const render = () => {
        const ctx = dynamicCanvas.current?.getContext('2d')
        const overlayCtx = overlayCanvas.current?.getContext('2d')
        if (!match || !ctx || !overlayCtx) return

        const currentTurn = match.currentTurn
        const map = currentTurn.map

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
        map.draw(match, ctx, appContext.state.config, selectedBodyID, hoveredBodyID)
        currentTurn.bodies.draw(match, ctx, overlayCtx, appContext.state.config, selectedBodyID, hoveredBodyID)
        currentTurn.actions.draw(match, ctx)
    }
    useEffect(render, [hoveredBodyID, selectedBodyID])
    useListenEvent(EventType.RENDER, render, [render])

    const fullRender = () => {
        const ctx = backgroundCanvas.current?.getContext('2d')
        if (!match || !ctx) return
        match.currentTurn.map.staticMap.draw(ctx)
        render()
    }
    useListenEvent(EventType.INITIAL_RENDER, fullRender, [fullRender])

    const updateCanvasDimensions = (canvas: HTMLCanvasElement | null, dims: Vector) => {
        if (!canvas) return
        canvas.width = dims.x * TILE_RESOLUTION
        canvas.height = dims.y * TILE_RESOLUTION
        canvas.getContext('2d')?.scale(TILE_RESOLUTION, TILE_RESOLUTION)
    }

    useEffect(() => {
        if (!match) return
        const { width, height } = match.currentTurn.map
        updateCanvasDimensions(backgroundCanvas.current, { x: width, y: height })
        updateCanvasDimensions(dynamicCanvas.current, { x: width, y: height })
        updateCanvasDimensions(overlayCanvas.current, { x: width, y: height })
        setSelectedSquare(undefined)
        setSelectedBodyID(undefined)
        setHoveredTile(undefined)
        setHoveredBodyID(undefined)
        publishEvent(EventType.INITIAL_RENDER, {})
    }, [match, backgroundCanvas.current, dynamicCanvas.current, overlayCanvas.current])

    const eventToPoint = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = e.target as HTMLCanvasElement
        const rect = canvas.getBoundingClientRect()
        const map = match!.currentTurn!.map ?? assert.fail('map is null in onclick')
        let x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
        let y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * map.height)
        x = Math.max(0, Math.min(x, map.width - 1))
        y = Math.max(0, Math.min(y, map.height - 1))
        return { x: x, y: y }
    }
    const mouseDown = React.useRef(false)
    const mouseDownRightPrev = React.useRef(false)
    const lastFiredDragEvent = React.useRef({ x: -1, y: -1 })
    const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        mouseDown.current = false
        lastFiredDragEvent.current = { x: -1, y: -1 }
        if (e.button === 2) mouseDownRight(false, e)
    }
    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        mouseDown.current = true
        if (e.button === 2) mouseDownRight(true, e)
    }
    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const tile = eventToPoint(e)
        if (tile.x !== hoveredTile?.x || tile.y !== hoveredTile?.y) setHoveredTile(tile)
    }
    const mouseDownRight = (down: boolean, e?: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (down === mouseDownRightPrev.current) return
        mouseDownRightPrev.current = down
        if (!down && e) onCanvasClick(e)
        publishEvent(EventType.CANVAS_RIGHT_CLICK, { down: down })
    }
    const onMouseLeave = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        onMouseUp(e)
        mouseDownRight(false)
        setHoveredTile(undefined)
    }
    const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const point = eventToPoint(e)
        const clickedBody = match?.currentTurn?.bodies.getBodyAtLocation(point.x, point.y)
        setSelectedBodyID(clickedBody ? clickedBody.id : undefined)
        setSelectedSquare(clickedBody || !match?.game.playable ? undefined : point)
        publishEvent(EventType.TILE_CLICK, point)
    }
    const onCanvasDrag = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const tile = eventToPoint(e)
        if (tile.x !== hoveredTile?.x || tile.y !== hoveredTile?.y) setHoveredTile(tile)
        if (tile.x === lastFiredDragEvent.current.x && tile.y === lastFiredDragEvent.current.y) return
        lastFiredDragEvent.current = tile
        publishEvent(EventType.TILE_DRAG, tile)
    }

    return (
        <div
            className="relative w-full h-screen flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            ref={wrapperRef}
        >
            {!match ? (
                <p className="text-white text-center">Select a game from the queue</p>
            ) : (
                <>
                    <canvas
                        className="absolute top-1/2 left-1/2 max-w-full max-h-full"
                        style={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: 0,
                            cursor: 'pointer'
                        }}
                        ref={backgroundCanvas}
                    />
                    <canvas
                        className="absolute top-1/2 left-1/2 max-w-full max-h-full"
                        style={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                            cursor: 'pointer'
                        }}
                        ref={dynamicCanvas}
                    />
                    <canvas
                        className="absolute top-1/2 left-1/2 max-w-full max-h-full"
                        style={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            cursor: 'pointer'
                        }}
                        ref={overlayCanvas}
                        onClick={onCanvasClick}
                        onMouseMove={(e) => {
                            if (mouseDown.current) onCanvasDrag(e)
                            onMouseMove(e)
                        }}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseLeave}
                        onMouseEnter={(e) => {
                            if (e.buttons === 1) mouseDown.current = true
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault()
                        }}
                    />
                    <Tooltip
                        overlayCanvas={overlayCanvas.current}
                        selectedBodyID={selectedBodyID}
                        hoveredBodyID={hoveredBodyID}
                        hoveredSquare={hoveredTile}
                        selectedSquare={selectedSquare}
                        wrapperRef={wrapperRef.current}
                    />
                    <HighlightedSquare
                        hoveredTile={hoveredTile}
                        map={match?.currentTurn.map}
                        wrapperRef={wrapperRef.current}
                        overlayCanvasRef={overlayCanvas.current}
                    />
                </>
            )}
        </div>
    )
}

interface HighlightedSquareProps {
    overlayCanvasRef: HTMLCanvasElement | null
    wrapperRef: HTMLDivElement | null
    map?: CurrentMap
    hoveredTile?: Vector
}
const HighlightedSquare: React.FC<HighlightedSquareProps> = ({ overlayCanvasRef, wrapperRef, map, hoveredTile }) => {
    if (!hoveredTile || !map || !wrapperRef || !overlayCanvasRef) return <></>
    const overlayCanvasRect = overlayCanvasRef.getBoundingClientRect()
    const wrapperRect = wrapperRef.getBoundingClientRect()
    const mapLeft = overlayCanvasRect.left - wrapperRect.left
    const mapTop = overlayCanvasRect.top - wrapperRect.top
    const tileWidth = overlayCanvasRect.width / map.width
    const tileHeight = overlayCanvasRect.height / map.height
    const tileLeft = mapLeft + tileWidth * hoveredTile.x
    const tileTop = mapTop + tileHeight * (map.height - hoveredTile.y - 1)
    return (
        <div
            className="absolute border-2 border-black/70 z-10 cursor-pointer"
            style={{
                left: tileLeft + 'px',
                top: tileTop + 'px',
                width: overlayCanvasRect.width / map.width + 'px',
                height: overlayCanvasRect.height / map.height + 'px',
                pointerEvents: 'none'
            }}
        />
    )
}
