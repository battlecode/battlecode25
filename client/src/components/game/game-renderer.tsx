import React, { useRef } from 'react'
import { Vector } from '../../playback/Vector'
import { CurrentMap } from '../../playback/Map'
import { useMatch, useRound, useTurnNumber } from '../../playback/GameRunner'
import { CanvasLayers, GameRenderer } from '../../playback/GameRenderer'
import { Space, VirtualSpaceRect } from 'react-zoomable-ui'
import { ResetZoomIcon } from '../../icons/resetzoom'
import { useAppContext } from '../../app-context'
import Round from '../../playback/Round'
import { DraggableTooltip, FloatingTooltip } from './tooltip'
import Tooltip from '../tooltip'

export const GameRendererPanel: React.FC = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const [hoveredTileRect, setHoveredTileRect] = React.useState<DOMRect | undefined>(undefined)

    const appContext = useAppContext()
    const round = useRound()

    // Unused, but we want to rerender the tooltips when the turn changes as well
    const turn = useTurnNumber()

    const { selectedBodyID } = GameRenderer.useCanvasClickEvents()
    const { hoveredTile } = GameRenderer.useCanvasHoverEvents()
    const selectedBody = selectedBodyID !== undefined ? round?.bodies.bodies.get(selectedBodyID) : undefined
    const hoveredBody = hoveredTile ? round?.bodies.getBodyAtLocation(hoveredTile.x, hoveredTile.y) : undefined

    const floatingTooltipContent = (
        hoveredBody
            ? hoveredBody.onHoverInfo()
            : hoveredTile && round
              ? round.map.getTooltipInfo(hoveredTile, round!.match)
              : []
    ).map((v, i) => <p key={i}>{v}</p>)

    const draggableTooltipContent = selectedBody
        ? selectedBody.onHoverInfo().map((v, i) => <p key={i}>{v}</p>)
        : undefined

    const container = wrapperRef.current?.getBoundingClientRect() || { x: 0, y: 0, width: 0, height: 0 }

    return (
        <div
            className="relative w-full h-screen flex items-center justify-center"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            ref={wrapperRef}
        >
            {!round ? (
                <p className="text-white text-center">Select a game from the queue</p>
            ) : (
                <>
                    <ZoomableGameRenderer
                        round={round}
                        hoveredTile={hoveredTile}
                        setHoveredTileRect={setHoveredTileRect}
                    />
                    {hoveredTileRect && wrapperRef.current && floatingTooltipContent.length > 0 && (
                        <FloatingTooltip
                            target={hoveredTileRect}
                            container={container}
                            content={floatingTooltipContent}
                        />
                    )}
                    <DraggableTooltip content={draggableTooltipContent} container={container} />
                    {appContext.state.config.showMapXY && hoveredTile && (
                        <div className="absolute right-[5px] top-[5px] bg-black/70 z-20 text-white p-2 rounded-md text-xs opacity-50 pointer-events-none">
                            {`(X: ${hoveredTile.x}, Y: ${hoveredTile.y})`}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

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
    return (
        <div
            ref={divRef}
            onClick={(e) => {
                // Dont clear the GameRenderer selection
                e.stopPropagation()
            }}
        >
            {children}
        </div>
    )
}

const ZoomableGameRenderer: React.FC<{
    round: Round
    hoveredTile: Vector | undefined
    setHoveredTileRect: (rect: DOMRect | undefined) => void
}> = React.memo(({ round, hoveredTile, setHoveredTileRect }) => {
    const spaceRef = useRef<Space | null>(null)

    const playable = round.match.game.playable // playable unless we are in the map editor
    React.useEffect(() => {
        if (spaceRef.current && spaceRef.current.viewPort) {
            if (!playable) {
                // disable zooming and panning in map editor
                const vp = spaceRef.current.viewPort
                vp.setBounds({ x: [0, vp.containerWidth], y: [0, vp.containerHeight], zoom: [1, 1] })
            } else {
                const vp = spaceRef.current.viewPort
                vp.setBounds({ x: [-10000, 10000], y: [-10000, 10000], zoom: [0.1, 10] })
            }
        }
    }, [playable])

    const gameAreaRect = spaceRef.current?.viewPort?.translateClientRectToVirtualSpace(
        GameRenderer.canvas(CanvasLayers.Overlay).getBoundingClientRect()
    )

    const [canResetCamera, setCanResetCamera] = React.useState(false)
    const hoveredTileRef = React.useRef<HTMLDivElement | null>(null)

    const resetCamera = (e?: KeyboardEvent) => {
        if (!spaceRef.current) return
        if (e && e.code !== 'KeyR') return

        spaceRef.current.viewPort?.camera.updateTopLeft(0, 0, 1)
        GameRenderer.clearSelected()
    }

    React.useEffect(() => {
        const resize = () => resetCamera()
        window.addEventListener('resize', resize)
        window.addEventListener('keydown', resetCamera)
        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('keydown', resetCamera)
        }
    }, [])

    const match = useMatch()
    React.useEffect(resetCamera, [match])

    return (
        <div onClick={() => GameRenderer.clearSelected()}>
            <Space
                ref={spaceRef}
                onUpdated={(vp) => {
                    setCanResetCamera(!(vp.left === 0 && vp.top === 0 && vp.zoomFactor === 1))
                    setHoveredTileRect(hoveredTileRef.current?.getBoundingClientRect())
                }}
            >
                <GameRendererCanvases>
                    <HighlightedSquare
                        hoveredTile={hoveredTile}
                        map={round.map}
                        gameAreaRect={gameAreaRect}
                        ref={(ref) => {
                            hoveredTileRef.current = ref
                            setHoveredTileRect(ref?.getBoundingClientRect())
                        }}
                    />
                </GameRendererCanvases>
            </Space>
            {canResetCamera && (
                <div style={{ top: hoveredTile ? '35px' : '0px' }} className="absolute z-10 right-0 m-2 p-2 fill-white">
                    <Tooltip text={'Reset Camera (r)'} location="left">
                        <button
                            className="opacity-50"
                            onClick={(e) => {
                                resetCamera()
                                // Dont clear the GameRenderer selection
                                if (e) e.stopPropagation()
                            }}
                        >
                            <ResetZoomIcon />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    )
})

const HighlightedSquare = React.memo(
    React.forwardRef<
        HTMLDivElement,
        {
            gameAreaRect?: VirtualSpaceRect
            map?: CurrentMap
            hoveredTile?: Vector
        }
    >(({ gameAreaRect, map, hoveredTile }, ref) => {
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
    })
)
