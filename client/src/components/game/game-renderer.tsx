import React, { useRef } from 'react'
import { Vector } from '../../playback/Vector'
import { Tooltip } from './tooltip'
import { CurrentMap } from '../../playback/Map'
import { useMatch, useTurn } from '../../playback/GameRunner'
import { CanvasLayers, GameRenderer } from '../../playback/GameRenderer'
import { Pressable, PressEventCoordinates, Space, ViewPortCamera, VirtualSpaceRect } from 'react-zoomable-ui'
import { ResetZoomIcon } from '../../icons/resetzoom'

const GameRendererCanvases: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    /**
     * This component is set up in this way to prevent the canvases from being
     * re-added to the DOM on every render. This is important because re-adding
     * the canvases on every re-render breaks some canvas events like click
     */
    const divRef = useRef(null)
    React.useEffect(() => {
        GameRenderer.addCanvasesToDOM(divRef.current)
    }, [])
    return <div ref={divRef}>{children}</div>
}

export const GameRendererPanel: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const spaceRef = useRef<Space | null>(null)
    const hoveredTileRef = React.useRef<HTMLDivElement>(null)
    const [canResetCamera, setCanResetCamera] = React.useState(false)

    const resetCamera = () => {
        if (spaceRef.current) spaceRef.current.viewPort?.camera.updateTopLeft(0, 0, 1)
        setCanResetCamera(false)
    }

    const match = useMatch()
    React.useEffect(resetCamera, [match])

    const turn = useTurn()
    const { selectedBodyID, hoveredTile, selectedTile } = GameRenderer.useCanvasEvents()

    const gameAreaRect = spaceRef.current?.viewPort?.translateClientRectToVirtualSpace(
        GameRenderer.canvas(CanvasLayers.Overlay).getBoundingClientRect()
    )
    // const originalGameAreaSize = spaceRef.current?.viewPort
    //     ? { width: spaceRef.current.viewPort.containerWidth, height: spaceRef.current.viewPort.containerHeight }
    //     : undefined

    React.useEffect(() => {
        if (spaceRef.current && spaceRef.current.viewPort) {
            if (!match?.game.playable) {
                // disable zooming and panning in map editor
                const vp = spaceRef.current.viewPort
                vp.setBounds({ x: [0, vp.containerWidth], y: [0, vp.containerHeight], zoom: [1, 1] })
            } else {
                const vp = spaceRef.current.viewPort
                vp.setBounds({ x: [-10000, 10000], y: [-10000, 10000], zoom: [0.1, 10] })
            }
        }
    }, [match?.game.playable])

    return (
        <div
            className="relative w-full h-screen flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            ref={wrapperRef}
        >
            {canResetCamera && (
                <button className="absolute top-0 z-10 right-0 m-2 p-2" onClick={resetCamera}>
                    <ResetZoomIcon />
                </button>
            )}

            {!turn ? (
                <p className="text-white text-center">Select a game from the queue</p>
            ) : (
                <>
                    <Space ref={spaceRef} onUpdated={() => setCanResetCamera(true)}>
                        <GameRendererCanvases>
                            <HighlightedSquare
                                hoveredTile={hoveredTile}
                                map={turn.map}
                                gameAreaRect={gameAreaRect}
                                ref={hoveredTileRef}
                            />
                        </GameRendererCanvases>
                    </Space>
                    <Tooltip
                        selectedBodyID={selectedBodyID}
                        hoveredTile={hoveredTile}
                        hoveredTileRef={hoveredTileRef}
                    />
                </>
            )}
        </div>
    )
}

interface HighlightedSquareProps {
    gameAreaRect?: VirtualSpaceRect
    map?: CurrentMap
    hoveredTile?: Vector
}

const HighlightedSquare = React.forwardRef<HTMLDivElement, HighlightedSquareProps>(
    ({ gameAreaRect, map, hoveredTile }, ref) => {
        if (!hoveredTile || !map || !gameAreaRect) return <></>
        const mapLeft = gameAreaRect.left
        const mapTop = gameAreaRect.top
        const tileWidth = gameAreaRect.width / map.width
        const tileHeight = gameAreaRect.height / map.height
        const tileLeft = mapLeft + tileWidth * hoveredTile.x
        const tileTop = mapTop + tileHeight * (map.height - hoveredTile.y - 1)
        return (
            <div
                ref={ref}
                className="absolute border-2 border-black/70 z-10 cursor-pointer"
                style={{
                    left: tileLeft + 'px',
                    top: tileTop + 'px',
                    width: gameAreaRect.width / map.width + 'px',
                    height: gameAreaRect.height / map.height + 'px',
                    pointerEvents: 'none'
                }}
            />
        )
    }
)
