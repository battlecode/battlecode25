import React, { useEffect } from 'react'
import { useAppContext } from '../../app-context'
import { ThreeBarsIcon } from '../../icons/three-bars'
import { getRenderCoords } from '../../util/RenderUtil'
import { Vector } from '../../playback/Vector'
import { useTurn } from '../../playback/GameRunner'
import { Pressable, VirtualSpaceRect } from 'react-zoomable-ui'

type TooltipProps = {
    gameAreaRect?: VirtualSpaceRect
    originalGameAreaSize?: { width: number; height: number }
    selectedBodyID: number | undefined
    hoveredTile: Vector | undefined
    selectedTile: Vector | undefined
    clientToVirtualSpace?: (clientX: number, clientY: number) => { x: number; y: number }
}

export const Tooltip = ({
    gameAreaRect,
    originalGameAreaSize,
    selectedBodyID,
    hoveredTile,
    selectedTile,
    clientToVirtualSpace
}: TooltipProps) => {
    const appContext = useAppContext()
    const turn = useTurn()

    const selectedBody = selectedBodyID !== undefined ? turn?.bodies.bodies.get(selectedBodyID) : undefined
    const hoveredBody = hoveredTile ? turn?.bodies.getBodyAtLocation(hoveredTile.x, hoveredTile.y) : undefined

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
    }, [hoveredBody, hoveredTile])

    const map = turn?.map
    if (!gameAreaRect || !map || !originalGameAreaSize) return <></>

    const getTooltipStyle = () => {
        const tileWidth = gameAreaRect.width / map.width
        const tileHeight = gameAreaRect.height / map.height
        const mapLeft = gameAreaRect.left
        const mapTop = gameAreaRect.top

        let tooltipStyle: React.CSSProperties = {}

        if (!hoveredBody && !hoveredTile) return tooltipStyle

        let tipPos: Vector
        if (hoveredBody) {
            tipPos = getRenderCoords(hoveredBody.pos.x, hoveredBody.pos.y, map.dimension, true)
        } else {
            tipPos = getRenderCoords(hoveredTile!.x, hoveredTile!.y, map.dimension, true)
        }
        const distanceFromBotCenterX = 0.75 * tileWidth
        const distanceFromBotCenterY = 0.75 * tileHeight
        const clearanceLeft = mapLeft + tipPos.x * tileWidth - distanceFromBotCenterX
        const clearanceRight = originalGameAreaSize.width - clearanceLeft - 2 * distanceFromBotCenterX
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

    let showFloatingTooltip = !!((hoveredBody && hoveredBody != selectedBody) || hoveredTile)
    const tooltipContent = hoveredBody
        ? hoveredBody.onHoverInfo()
        : hoveredTile
          ? map.getTooltipInfo(hoveredTile, turn!.match)
          : []

    if (tooltipContent.length === 0) showFloatingTooltip = false

    // Check for the default empty size and don't show before the resize observer
    // has updated
    if (tooltipSize.width < 20 || tooltipSize.height < 20) showFloatingTooltip = false

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

            <Draggable
                width={originalGameAreaSize.width}
                height={originalGameAreaSize.height}
                clientToVirtualSpace={clientToVirtualSpace}
                margin={10}
            >
                {selectedBody && (
                    <Pressable capturePressThresholdMs={0}>
                        <div className="bg-black/90 z-20 text-white p-2 rounded-md text-xs cursor-pointer relative">
                            {selectedBody.onHoverInfo().map((v, i) => (
                                <p key={i}>{v}</p>
                            ))}
                            <div className="absolute top-0 right-0" style={{ transform: 'scaleX(0.57) scaleY(0.73)' }}>
                                <ThreeBarsIcon />
                            </div>
                        </div>
                    </Pressable>
                )}
            </Draggable>

            {appContext.state.config.showMapXY && hoveredTile && (
                <div className="absolute right-[5px] top-[5px] bg-black/70 z-20 text-white p-2 rounded-md text-xs opacity-50 pointer-events-none">
                    {`(X: ${hoveredTile.x}, Y: ${hoveredTile.y})`}
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
    clientToVirtualSpace?: (clientX: number, clientY: number) => { x: number; y: number }
}

const Draggable = ({ children, width, height, clientToVirtualSpace, margin = 0 }: DraggableProps) => {
    const [dragging, setDragging] = React.useState(false)
    const [pos, setPos] = React.useState({ x: 20, y: 20 })
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const ref = React.useRef<HTMLDivElement>(null)
    const realSize = clientToVirtualSpace ? clientToVirtualSpace(width, height) : { x: width, y: height }

    const mouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        const mouse = clientToVirtualSpace ? clientToVirtualSpace(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY }
        setOffset({ x: mouse.x - pos.x, y: mouse.x - pos.y })
    }

    const mouseUp = () => {
        setDragging(false)
    }

    const mouseMove = (e: MouseEvent) => {
        if (dragging && ref.current) {
            const mouse = clientToVirtualSpace
                ? clientToVirtualSpace(e.clientX, e.clientY)
                : { x: e.clientX, y: e.clientY }
            const targetX = mouse.x - offset.x
            const targetY = mouse.y - offset.y
            const realInnerSize = clientToVirtualSpace ? clientToVirtualSpace(ref.current.clientWidth, ref.current.clientHeight) : { x: ref.current.clientWidth, y: ref.current.clientHeight }
            const realX = Math.min(Math.max(targetX, margin), realSize.x - realInnerSize.x - margin)
            const realY = Math.min(Math.max(targetY, margin), realSize.y - realInnerSize.y - margin)
            setPos({ x: realX, y: realY })
        }
    }

    React.useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', mouseMove)
            window.addEventListener('mouseup', mouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', mouseMove)
            window.removeEventListener('mouseup', mouseUp)
        }
    }, [dragging])

    return (
        <div
            ref={ref}
            onMouseDown={mouseDown}
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
