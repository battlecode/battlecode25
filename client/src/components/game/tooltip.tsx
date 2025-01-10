import React from 'react'
import { ThreeBarsIcon } from '../../icons/three-bars'
import { Vector } from '../../playback/Vector'

type Rect = { x: number; y: number; width: number; height: number }

export const FloatingTooltip: React.FC<{
    container: Rect
    target: Rect
    content: React.ReactNode
    margin?: number
}> = ({ container, target, content, margin = 10 }) => {
    const tooltipRef = React.useRef<HTMLDivElement | null>(null)
    const [tooltipSize, setTooltipSize] = React.useState({ width: 0, height: 0 })
    React.useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return

            // Check if this property exists, it may not for older OSes
            if (entry.borderBoxSize) {
                const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize
                setTooltipSize({ width: borderBox.inlineSize, height: borderBox.blockSize })
            } else {
                // Fallback to contentRect
                const rect = entry.contentRect
                setTooltipSize({ width: rect.width, height: rect.height })
            }
        })
        if (tooltipRef.current) observer.observe(tooltipRef.current)
        return () => {
            if (tooltipRef.current) observer.unobserve(tooltipRef.current)
        }
    }, [])

    const tipPos: Vector = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2
    }
    const distanceFromBotCenterY = 0.75 * target.height
    const clearanceTop = tipPos.y - distanceFromBotCenterY - container.y - margin
    const tooltipStyle = {
        top:
            clearanceTop > tooltipSize.height
                ? tipPos.y - tooltipSize.height - distanceFromBotCenterY - container.y + 'px'
                : tipPos.y + distanceFromBotCenterY - container.y + 'px',
        left:
            Math.max(
                margin,
                Math.min(tipPos.x - container.x - tooltipSize.width / 2, container.width - tooltipSize.width - margin)
            ) + 'px'
    }

    // we show even when the tooltip isnt ready because we need it to render invisibly to get the size
    const showFloatingTooltip = tooltipSize.width > 20 && tooltipSize.height > 20 && target.width > 0

    return (
        <div
            className="absolute bg-black/70 opacity-95 z-20 text-white p-2 rounded-md text-xs whitespace-nowrap pointer-events-none"
            style={{
                ...tooltipStyle,
                visibility: showFloatingTooltip ? 'visible' : 'hidden'
            }}
            ref={tooltipRef}
        >
            {content}
        </div>
    )
}

export const DraggableTooltip: React.FC<{ container: Rect; content: React.ReactNode }> = ({ container, content }) => {
    return (
        <Draggable width={container.width} height={container.height}>
            {content && (
                <div className="bg-black/90 opacity-95 z-20 text-white p-2 rounded-md text-xs cursor-pointer relative pointer-events-auto">
                    {content}
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

const Draggable = ({ children, width, height, margin = 10 }: DraggableProps) => {
    const [dragging, setDragging] = React.useState(false)
    const [pos, setPos] = React.useState({ x: margin, y: margin })
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const ref = React.useRef<HTMLDivElement>(null)
    const realSize = { x: width, y: height }

    const mouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        setOffset({ x: e.screenX - pos.x, y: e.screenY - pos.y })
        e.stopPropagation()
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
