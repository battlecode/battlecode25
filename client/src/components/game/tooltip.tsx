import React, { useEffect } from 'react'
import { useAppContext } from '../../app-context'
import { ThreeBarsIcon } from '../../icons/three-bars'
import { Vector } from '../../playback/Vector'
import { useTurn } from '../../playback/GameRunner'

type Rect = { x: number; y: number; width: number; height: number }
type TooltipProps = {
    originalGameAreaSize?: { width: number; height: number }
    selectedBodyID: number | undefined
    hoveredTile: Vector | undefined
    hoveredTileRef: React.RefObject<HTMLDivElement>
}

export const Tooltip = ({ selectedBodyID, hoveredTile, hoveredTileRef }: TooltipProps) => {
    const appContext = useAppContext()
    const turn = useTurn()

    const selectedBody = selectedBodyID !== undefined ? turn?.bodies.bodies.get(selectedBodyID) : undefined
    const hoveredBody = hoveredTile ? turn?.bodies.getBodyAtLocation(hoveredTile.x, hoveredTile.y) : undefined

    const wrapperRef = React.useRef<HTMLDivElement>(null)

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
    if (!map) return <></>

    const getTooltipStyle = (hoveredTileRect: Rect, container: Rect) => {
        let tooltipStyle: React.CSSProperties = {}
        const tipPos: Vector = {
            x: hoveredTileRect.x + hoveredTileRect.width / 2,
            y: hoveredTileRect.y + hoveredTileRect.height / 2
        }
        const distanceFromBotCenterX = 0.75 * hoveredTileRect.width
        const distanceFromBotCenterY = 0.75 * hoveredTileRect.height
        const clearanceLeft = tipPos.x - distanceFromBotCenterX - container.x
        const clearanceRight = container.x + container.width - (tipPos.x + distanceFromBotCenterX)
        const clearanceTop = tipPos.y - distanceFromBotCenterY - container.y

        if (clearanceTop > tooltipSize.height) {
            tooltipStyle.top = tipPos.y - tooltipSize.height - distanceFromBotCenterY - container.y + 'px'
        } else {
            tooltipStyle.top = tipPos.y + distanceFromBotCenterY - container.y + 'px'
        }

        if (clearanceLeft < tooltipSize.width / 2) {
            tooltipStyle.left = tipPos.x + distanceFromBotCenterX - container.x + 'px'
        } else if (clearanceRight < tooltipSize.width / 2) {
            tooltipStyle.left = tipPos.x - tooltipSize.width - distanceFromBotCenterX - container.x + 'px'
        } else {
            tooltipStyle.left = tipPos.x - tooltipSize.width / 2 - container.x + 'px'
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
        <div
            style={{
                WebkitUserSelect: 'none',
                userSelect: 'none',
                inset: 0,
                position: 'absolute',
                pointerEvents: 'none'
            }}
            ref={wrapperRef}
        >
            <div
                className="absolute bg-black/70 z-20 text-white p-2 rounded-md text-xs"
                style={{
                    ...getTooltipStyle(
                        hoveredTileRef.current?.getBoundingClientRect() || { x: 0, y: 0, width: 0, height: 0 },
                        wrapperRef.current?.getBoundingClientRect() || { x: 0, y: 0, width: 0, height: 0 }
                    ),
                    visibility: showFloatingTooltip ? 'visible' : 'hidden'
                }}
                ref={tooltipRef}
            >
                {tooltipContent.map((v, i) => (
                    <p key={i}>{v}</p>
                ))}
            </div>

            <Draggable
                width={wrapperRef.current?.clientWidth || 0}
                height={wrapperRef.current?.clientHeight || 0}
                margin={10}
            >
                {selectedBody && (
                    <div className="bg-black/90 z-20 text-white p-2 rounded-md text-xs cursor-pointer relative pointer-events-auto">
                        {selectedBody.onHoverInfo().map((v, i) => (
                            <p key={i}>{v}</p>
                        ))}
                        <div className="absolute top-0 right-0" style={{ transform: 'scaleX(0.57) scaleY(0.73)' }}>
                            <ThreeBarsIcon />
                        </div>
                    </div>
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
}

const Draggable = ({ children, width, height, margin = 0 }: DraggableProps) => {
    const [dragging, setDragging] = React.useState(false)
    const [pos, setPos] = React.useState({ x: 20, y: 20 })
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const ref = React.useRef<HTMLDivElement>(null)
    const realSize = { x: width, y: height }

    const mouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        setOffset({ x: e.screenX - pos.x, y: e.screenY - pos.y })
    }

    const mouseUp = () => {
        setDragging(false)
    }

    const mouseMove = (e: MouseEvent) => {
        if (dragging && ref.current) {
            const targetX = e.screenX - offset.x
            const targetY = e.screenY - offset.y
            const realTooltipSize = { x: ref.current.clientWidth, y: ref.current.clientHeight }
            const realX = Math.min(Math.max(targetX, margin), realSize.x - realTooltipSize.x - margin)
            const realY = Math.min(Math.max(targetY, margin), realSize.y - realTooltipSize.y - margin)
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
