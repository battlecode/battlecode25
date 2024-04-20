import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../app-context'
import { Vector } from '../../util/vector'
import { EventType, publishEvent, useListenEvent } from '../../app-events'
import { Overlay } from './overlay'
import { TILE_RESOLUTION } from '../../current-game/Constants'
import { CurrentMap } from '../../current-game/Map'
import Match from '../../current-game/Match'
import { ClientConfig } from '../../client-config'

export const GameRenderer: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const backgroundCanvas = useRef<HTMLCanvasElement | null>(null)
    const dynamicCanvas = useRef<HTMLCanvasElement | null>(null)
    const overlayCanvas = useRef<HTMLCanvasElement | null>(null)

    const appContext = useAppContext()
    const { activeMatch, config } = appContext.state

    const {
        onMouseMove,
        onMouseDown,
        onMouseUp,
        onMouseLeave,
        onMouseEnter,
        onCanvasClick,
        selectedBodyID,
        hoveredTile,
        hoveredBodyID
    } = useRenderEvents(activeMatch, config, backgroundCanvas, dynamicCanvas, overlayCanvas)

    return (
        <div
            className="relative w-full h-screen flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            ref={wrapperRef}
        >
            {!activeMatch ? (
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
                        onMouseMove={onMouseMove}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseLeave}
                        onMouseEnter={onMouseEnter}
                        onContextMenu={(e) => {
                            e.preventDefault()
                        }}
                    />
                    {overlayCanvas.current && wrapperRef.current && activeMatch && (
                        <Overlay
                            match={activeMatch}
                            overlayCanvas={overlayCanvas.current}
                            selectedBodyID={selectedBodyID}
                            hoveredBodyID={hoveredBodyID}
                            hoveredTile={hoveredTile}
                            wrapperRef={wrapperRef.current}
                        />
                    )}
                </>
            )}
        </div>
    )
}

const useHoveredBody = (hoveredTile: Vector | undefined, match: Match | undefined) => {
    const [hoveredBodyID, setHoveredBodyID] = useState<number | undefined>(undefined)
    const calculateHoveredBodyID = () => {
        if (!hoveredTile) return setHoveredBodyID(undefined)
        if (!match) return
        const hoveredBody = match.currentTurn.bodies.getBodyAtLocation(hoveredTile.x, hoveredTile.y)
        setHoveredBodyID(hoveredBody?.id)
    }
    useEffect(calculateHoveredBodyID, [hoveredTile, match])
    useListenEvent(EventType.NEW_TURN, calculateHoveredBodyID)
    return hoveredBodyID
}

const useRenderEvents = (
    match: Match | undefined,
    config: ClientConfig,
    backgroundCanvas: MutableRefObject<HTMLCanvasElement | null>,
    dynamicCanvas: MutableRefObject<HTMLCanvasElement | null>,
    overlayCanvas: MutableRefObject<HTMLCanvasElement | null>
) => {
    const [selectedBodyID, setSelectedBodyID] = useState<number | undefined>(undefined)
    const [hoveredTile, setHoveredTile] = useState<Vector | undefined>(undefined)
    const mouseDown = React.useRef(false)
    const mouseDownRightPrev = React.useRef(false)
    const lastFiredDragEvent = React.useRef({ x: -1, y: -1 })
    const hoveredBodyID = useHoveredBody(hoveredTile, match)

    const lastRender = useRef(0)
    const queueTimeout = useRef<NodeJS.Timeout | null>(null)
    const queueRender = () => {
        if (queueTimeout.current) clearTimeout(queueTimeout.current)
        if (Date.now() - lastRender.current > 1000 / 60) {
            render()
        } else {
            queueTimeout.current = setTimeout(render, 1000 / 60)
        }
    }

    const render = (full: boolean = false) => {
        const ctx = dynamicCanvas.current?.getContext('2d')
        const overlayCtx = overlayCanvas.current?.getContext('2d')
        const staticCtx = backgroundCanvas.current?.getContext('2d')
        if (!match || !ctx || !overlayCtx || !staticCtx) return

        lastRender.current = Date.now()

        if (full) {
            staticCtx.clearRect(0, 0, staticCtx.canvas.width, staticCtx.canvas.height)
            match.currentTurn.map.staticMap.draw(staticCtx)
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height)
        match.currentTurn.map.draw(match, ctx, config, selectedBodyID, hoveredBodyID)
        match.currentTurn.bodies.draw(match, ctx, overlayCtx, config, selectedBodyID, hoveredBodyID)
        match.currentTurn.actions.draw(match, ctx)
    }

    useEffect(queueRender, [hoveredBodyID, selectedBodyID])
    useListenEvent(EventType.RENDER, queueRender, [render])
    useListenEvent(EventType.MAP_RENDER, () => render(true))

    useEffect(() => {
        if (!match) return
        const { width, height } = match.currentTurn.map
        updateCanvasDimensions(backgroundCanvas.current, { x: width, y: height })
        updateCanvasDimensions(dynamicCanvas.current, { x: width, y: height })
        updateCanvasDimensions(overlayCanvas.current, { x: width, y: height })
        setSelectedBodyID(undefined)
        setHoveredTile(undefined)
        render(true)
    }, [match, backgroundCanvas.current, dynamicCanvas.current, overlayCanvas.current])

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
        if (mouseDown.current) onCanvasDrag(e)
        const tile = eventToPoint(e, match?.currentTurn.map)
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
        const point = eventToPoint(e, match?.currentTurn.map)
        const clickedBody = match?.currentTurn.bodies.getBodyAtLocation(point.x, point.y)
        setSelectedBodyID(clickedBody ? clickedBody.id : undefined)
        publishEvent(EventType.TILE_CLICK, point)
    }
    const onCanvasDrag = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const tile = eventToPoint(e, match?.currentTurn.map)
        if (tile.x !== hoveredTile?.x || tile.y !== hoveredTile?.y) setHoveredTile(tile)
        if (tile.x === lastFiredDragEvent.current.x && tile.y === lastFiredDragEvent.current.y) return
        lastFiredDragEvent.current = tile
        publishEvent(EventType.TILE_DRAG, tile)
    }
    const onMouseEnter = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (e.buttons === 1) mouseDown.current = true
    }

    return {
        onMouseMove,
        onMouseDown,
        onMouseUp,
        onMouseLeave,
        onMouseEnter,
        onCanvasClick,
        onCanvasDrag,
        selectedBodyID,
        hoveredTile,
        hoveredBodyID
    }
}

const updateCanvasDimensions = (canvas: HTMLCanvasElement | null, dims: Vector) => {
    if (!canvas) return
    canvas.width = dims.x * TILE_RESOLUTION
    canvas.height = dims.y * TILE_RESOLUTION
    canvas.getContext('2d')?.scale(TILE_RESOLUTION, TILE_RESOLUTION)
}

const eventToPoint = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, map: CurrentMap | undefined) => {
    if (!map) throw new Error('Map is undefined in eventToPoint function')
    const canvas = e.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    let x = Math.floor(((e.clientX - rect.left) / rect.width) * map.width)
    let y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * map.height)
    x = Math.max(0, Math.min(x, map.width - 1))
    y = Math.max(0, Math.min(y, map.height - 1))
    return { x: x, y: y }
}
