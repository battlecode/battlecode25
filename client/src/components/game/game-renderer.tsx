import React, { useRef } from 'react'
import { Vector } from '../../playback/Vector'
import { Tooltip } from './tooltip'
import { CurrentMap } from '../../playback/Map'
import { useTurn } from '../../playback/GameRunner'
import { CanvasLayers, GameRenderer } from '../../playback/GameRenderer'

export const GameRendererPanel: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    const turn = useTurn()
    const { selectedBodyID, hoveredTile, selectedTile } = GameRenderer.useCanvasEvents()
    const overlayCanvas = GameRenderer.canvas(CanvasLayers.Overlay)

    return (
        <div
            className="relative w-full h-screen flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            ref={wrapperRef}
        >
            {!turn ? (
                <p className="text-white text-center">Select a game from the queue</p>
            ) : (
                <div
                    ref={(e) => {
                        GameRenderer.addCanvasesToDOM(e)
                    }}
                >
                    <Tooltip
                        overlayCanvas={overlayCanvas}
                        selectedBodyID={selectedBodyID}
                        hoveredTile={hoveredTile}
                        selectedTile={selectedTile}
                        wrapperRef={wrapperRef.current}
                    />
                    <HighlightedSquare
                        hoveredTile={hoveredTile}
                        map={turn.map}
                        wrapperRef={wrapperRef.current}
                        overlayCanvasRef={overlayCanvas}
                    />
                </div>
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
