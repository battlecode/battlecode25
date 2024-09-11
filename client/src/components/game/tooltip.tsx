import React, { useEffect } from 'react'
import { useAppContext } from '../../app-context'
import { ThreeBarsIcon } from '../../icons/three-bars'
import { getRenderCoords } from '../../util/RenderUtil'
import { Vector } from '../../playback/Vector'
import { useTurn } from '../../playback/GameRunner'

type TooltipProps = {
    overlayCanvas: HTMLCanvasElement | null
    selectedBodyID: number | undefined
    hoveredBodyID: number | undefined
    hoveredSquare: Vector | undefined
    selectedSquare: Vector | undefined
    wrapperRef: HTMLDivElement | null
}

export const Tooltip = ({
    overlayCanvas,
    selectedBodyID,
    hoveredBodyID,
    hoveredSquare,
    selectedSquare,
    wrapperRef
}: TooltipProps) => {
    const appContext = useAppContext()
    const turn = useTurn()

    const selectedBody = selectedBodyID !== undefined ? turn?.bodies.bodies.get(selectedBodyID) : undefined
    const hoveredBody = hoveredBodyID !== undefined ? turn?.bodies.bodies.get(hoveredBodyID) : undefined

    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const [tooltipSize, setTooltipSize] = React.useState({ width: 0, height: 0 })
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const borderBox = entries[0].borderBoxSize[0]
                setTooltipSize({ width: borderBox.inlineSize, height: borderBox.blockSize })
            }
        })
        if (tooltipRef.current) observer.observe(tooltipRef.current)
        return () => {
            if (tooltipRef.current) observer.unobserve(tooltipRef.current)
        }
    }, [hoveredBody, hoveredSquare])

    const map = turn?.map
    if (!overlayCanvas || !wrapperRef || !map) return <></>

    const wrapperRect = wrapperRef.getBoundingClientRect()

    const getTooltipStyle = () => {
        const overlayCanvasRect = overlayCanvas.getBoundingClientRect()
        const tileWidth = overlayCanvasRect.width / map.width
        const tileHeight = overlayCanvasRect.height / map.height
        const mapLeft = overlayCanvasRect.left - wrapperRect.left
        const mapTop = overlayCanvasRect.top - wrapperRect.top

        let tooltipStyle: React.CSSProperties = {}

        if (!hoveredBody && !hoveredSquare) return tooltipStyle

        let tipPos: Vector
        if (hoveredBody) {
            tipPos = getRenderCoords(hoveredBody.pos.x, hoveredBody.pos.y, map.dimension, true)
        } else {
            tipPos = getRenderCoords(hoveredSquare!.x, hoveredSquare!.y, map.dimension, true)
        }
        const distanceFromBotCenterX = 0.75 * tileWidth
        const distanceFromBotCenterY = 0.75 * tileHeight
        const clearanceLeft = mapLeft + tipPos.x * tileWidth - distanceFromBotCenterX
        const clearanceRight = wrapperRect.width - clearanceLeft - 2 * distanceFromBotCenterX
        const clearanceTop = mapTop + tipPos.y * tileHeight - distanceFromBotCenterY

        if (clearanceTop > tooltipSize.height) {
            tooltipStyle.top = mapTop + tipPos.y * tileHeight - tooltipSize.height - distanceFromBotCenterY + 'px'
        } else {
            tooltipStyle.top = mapTop + tipPos.y * tileHeight + distanceFromBotCenterY + 'px'
        }
        if (clearanceLeft < tooltipSize.width / 2) {
            tooltipStyle.left = mapLeft + tipPos.x * tileWidth + distanceFromBotCenterX + 'px'
        } else if (clearanceRight < tooltipSize.width / 2) {
            tooltipStyle.left = mapLeft + tipPos.x * tileWidth - tooltipSize.width - distanceFromBotCenterX + 'px'
        } else {
            tooltipStyle.left = mapLeft + tipPos.x * tileWidth - tooltipSize.width / 2 + 'px'
        }

        return tooltipStyle
    }

    let showFloatingTooltip = !!((hoveredBody && hoveredBody != selectedBody) || hoveredSquare)
    const tooltipContent = hoveredBody
        ? hoveredBody.onHoverInfo()
        : hoveredSquare
          ? map.getTooltipInfo(hoveredSquare, turn!.match)
          : []

    if (tooltipContent.length === 0) showFloatingTooltip = false

    // Check for the default empty size and don't show before the resize observer
    // has updated
    if (tooltipSize.width == 16 || tooltipSize.height == 16) showFloatingTooltip = false

    return (
        <div style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
            <div
                className="absolute bg-black/70 z-20 text-white p-2 rounded-md text-xs"
                style={{ ...getTooltipStyle(), visibility: showFloatingTooltip ? 'visible' : 'hidden' }}
                ref={tooltipRef}
            >
                {tooltipContent.map((v, i) => (
                    <p key={i}>{v}</p>
                ))}
            </div>

            <Draggable width={wrapperRect.width} height={wrapperRect.height}>
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

            {appContext.state.config.showMapXY && hoveredSquare && (
                <div className="absolute right-[5px] top-[5px] bg-black/70 z-20 text-white p-2 rounded-md text-xs opacity-50 pointer-events-none">
                    {`(X: ${hoveredSquare.x}, Y: ${hoveredSquare.y})`}
                </div>
            )}
        </div>
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
