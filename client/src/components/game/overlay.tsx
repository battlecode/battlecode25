import React, { useEffect } from 'react'
import { useAppContext } from '../../app-context'
import { useListenEvent, EventType } from '../../app-events'
import { useForceUpdate } from '../../util/react-util'
import { ThreeBarsIcon } from '../../icons/three-bars'
import { getRenderCoords } from '../../util/RenderUtil'
import { Vector } from '../../playback/Vector'
import Match from '../../playback/Match'
import { CurrentMap } from '../../playback/Map'
import { Body } from '../../playback/Bodies'
import { Vec } from 'battlecode-schema/js/battlecode/schema'

type OverlayProps = {
    match: Match
    overlayCanvas: HTMLCanvasElement
    selectedBodyID: number | undefined
    hoveredBodyID: number | undefined
    hoveredTile: Vector | undefined
    wrapperRef: HTMLDivElement
}

export const Overlay = ({
    match,
    overlayCanvas,
    selectedBodyID,
    hoveredBodyID,
    hoveredTile,
    wrapperRef
}: OverlayProps) => {
    const appContext = useAppContext()
    const forceUpdate = useForceUpdate()
    useListenEvent(EventType.NEW_TURN, forceUpdate) // update tooltip content

    const selectedBody = selectedBodyID !== undefined ? match.currentTurn.bodies.bodies.get(selectedBodyID) : undefined
    const hoveredBody = hoveredBodyID !== undefined ? match.currentTurn.bodies.bodies.get(hoveredBodyID) : undefined
    const map = match.currentTurn.map

    const wrapperRect = wrapperRef.getBoundingClientRect()

    const floatingTooltipContent = hoveredBody
        ? hoveredBody.onHoverInfo()
        : hoveredTile
          ? map.getTooltipInfo(hoveredTile, match!)
          : []
    const floatingTooltipFocus = hoveredBody ? hoveredBody.pos : hoveredTile
    const showFloatingTooltip = !!(
        ((hoveredBody && hoveredBody != selectedBody) || hoveredTile) &&
        floatingTooltipFocus &&
        floatingTooltipContent.length > 0
    )

    return (
        <>
            <div style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
                {showFloatingTooltip && (
                    <FloatingTooltip
                        mapPosition={floatingTooltipFocus}
                        wrapperRect={wrapperRect}
                        mapRect={overlayCanvas.getBoundingClientRect()}
                        map={map}
                    >
                        {floatingTooltipContent.map((v, i) => (
                            <p key={i}>{v}</p>
                        ))}
                    </FloatingTooltip>
                )}

                <DraggableTooltip
                    areaWidth={wrapperRect.width}
                    areaHeight={wrapperRect.height}
                    selectedBody={selectedBody}
                />

                {appContext.state.config.showMapXY && hoveredTile && (
                    <div className="absolute right-[5px] top-[5px] bg-black/70 z-20 text-white p-2 rounded-md text-xs opacity-50 pointer-events-none">
                        {`(X: ${hoveredTile.x}, Y: ${hoveredTile.y})`}
                    </div>
                )}
            </div>
            {hoveredTile && (
                <HighlightedSquare
                    hoveredTile={hoveredTile}
                    map={match.currentTurn.map}
                    wrapperRef={wrapperRef}
                    overlayCanvasRef={overlayCanvas}
                />
            )}
        </>
    )
}

interface FloatingTooltipProps {
    children: React.ReactNode
    mapPosition: Vector
    wrapperRect: DOMRect
    mapRect: DOMRect
    map: CurrentMap
}

const FloatingTooltip = ({ children, mapPosition, wrapperRect, mapRect, map }: FloatingTooltipProps) => {
    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const position = getRenderCoords(mapPosition.x, mapPosition.y, map.dimension, true)

    const [tooltipSize, setTooltipSize] = React.useState<Vector | undefined>(undefined)
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const borderBox = entries[0].borderBoxSize[0]
                setTooltipSize({ x: borderBox.inlineSize, y: borderBox.blockSize })
            }
        })
        if (tooltipRef.current) observer.observe(tooltipRef.current)
        return () => {
            if (tooltipRef.current) observer.unobserve(tooltipRef.current)
        }
    })

    const getTooltipStyle = () => {
        if (!tooltipSize) return {}
        
        const tileWidth = mapRect.width / map.width
        const tileHeight = mapRect.height / map.height
        const mapLeft = mapRect.left - wrapperRect.left
        const mapTop = mapRect.top - wrapperRect.top

        let tooltipStyle: React.CSSProperties = {}

        const distanceFromBotCenterX = 0.75 * tileWidth
        const distanceFromBotCenterY = 0.75 * tileHeight
        const clearanceLeft = mapLeft + position.x * tileWidth - distanceFromBotCenterX
        const clearanceRight = wrapperRect.width - clearanceLeft - 2 * distanceFromBotCenterX
        const clearanceTop = mapTop + position.y * tileHeight - distanceFromBotCenterY

        if (clearanceTop > tooltipSize.y) {
            tooltipStyle.top = mapTop + position.y * tileHeight - tooltipSize.y - distanceFromBotCenterY + 'px'
        } else {
            tooltipStyle.top = mapTop + position.y * tileHeight + distanceFromBotCenterY + 'px'
        }
        if (clearanceLeft < tooltipSize.x / 2) {
            tooltipStyle.left = mapLeft + position.x * tileWidth + distanceFromBotCenterX + 'px'
        } else if (clearanceRight < tooltipSize.x / 2) {
            tooltipStyle.left = mapLeft + position.x * tileWidth - tooltipSize.x - distanceFromBotCenterX + 'px'
        } else {
            tooltipStyle.left = mapLeft + position.x * tileWidth - tooltipSize.x / 2 + 'px'
        }

        return tooltipStyle
    }

    return (
        <div
            className="absolute bg-black/70 z-20 text-white p-2 rounded-md text-xs"
            style={{ ...getTooltipStyle(), visibility: tooltipSize ? 'visible' : 'hidden' }}
            ref={tooltipRef}
        >
            {children}
        </div>
    )
}
interface DraggableTooltipProps {
    areaWidth: number
    areaHeight: number
    selectedBody?: Body
}
const DraggableTooltip = ({ areaWidth, areaHeight, selectedBody }: DraggableTooltipProps) => {
    return (
        <Draggable width={areaWidth} height={areaHeight} margin={0}>
            {selectedBody && (
                <div className="bg-black/90 z-20 text-white p-2 rounded-md text-xs cursor-pointer relative">
                    {selectedBody.onHoverInfo().map((v, i) => (
                        <p key={i}>{v}</p>
                    ))}
                    <div className="absolute top-0 right-0" style={{ transform: 'scaleX(0.57) scaleY(0.73)' }}>
                        <ThreeBarsIcon />
                    </div>
                </div>
            )}
        </Draggable>
    )
}

interface DraggableProps {
    children: React.ReactNode
    width: number
    height: number
    margin?: number
}

const Draggable = ({ children, width, height, margin = 0 }: DraggableProps) => {
    const [dragging, setDragging] = React.useState(false)
    const [pos, setPos] = React.useState({ x: 20, y: 20 })
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const ref = React.useRef<HTMLDivElement>(null)

    const mouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    }

    const mouseUp = () => {
        setDragging(false)
    }

    const mouseMove = (e: React.MouseEvent) => {
        if (dragging && ref.current) {
            const targetX = e.clientX - offset.x
            const targetY = e.clientY - offset.y
            const realX = Math.min(Math.max(targetX, margin), width - ref.current.clientWidth - margin)
            const realY = Math.min(Math.max(targetY, margin), height - ref.current.clientHeight - margin)
            setPos({ x: realX, y: realY })
        }
    }

    return (
        <div
            ref={ref}
            onMouseDown={mouseDown}
            onMouseUp={mouseUp}
            onMouseLeave={mouseUp}
            onMouseEnter={(e) => {
                if (e.buttons === 1) mouseDown(e)
            }}
            onMouseMove={mouseMove}
            className="absolute z-20"
            style={{
                left: pos.x + 'px',
                top: pos.y + 'px'
            }}
        >
            {children}
        </div>
    )
}

interface HighlightedSquareProps {
    overlayCanvasRef: HTMLCanvasElement
    wrapperRef: HTMLDivElement
    map: CurrentMap
    hoveredTile: Vector
}
const HighlightedSquare: React.FC<HighlightedSquareProps> = ({ overlayCanvasRef, wrapperRef, map, hoveredTile }) => {
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
