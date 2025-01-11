import React, { useEffect } from 'react'
import { StaticMap } from '../../../playback/Map'
import { MapEditorBrushRow } from './map-editor-brushes'
import Bodies from '../../../playback/Bodies'
import Game from '../../../playback/Game'
import { Button, BrightButton, SmallButton } from '../../button'
import { NumInput, Select } from '../../forms'
import Match from '../../../playback/Match'
import { MapEditorBrush, UndoFunction } from './MapEditorBrush'
import { exportMap, loadFileAsMap } from './MapGenerator'
import { MAP_SIZE_RANGE } from '../../../constants'
import { InputDialog } from '../../input-dialog'
import { ConfirmDialog } from '../../confirm-dialog'
import GameRunner, { useRound } from '../../../playback/GameRunner'
import { GameRenderer } from '../../../playback/GameRenderer'
import { RingBuffer } from '../../../util/ring-buffer'

type MapParams = {
    width: number
    height: number
    symmetry: number
    imported?: Game | null
}

interface Props {
    open: boolean
}

const UNDO_STACK_SIZE = 100

export const MapEditorPage: React.FC<Props> = (props) => {
    const round = useRound()
    const [cleared, setCleared] = React.useState(true)
    const [mapParams, setMapParams] = React.useState<MapParams>({ width: 30, height: 30, symmetry: 0 })
    const [brushes, setBrushes] = React.useState<MapEditorBrush[]>([])
    const [mapNameOpen, setMapNameOpen] = React.useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false)
    const [mapError, setMapError] = React.useState('')
    const { canvasMouseDown } = GameRenderer.useCanvasClickEvents()
    const { hoveredTile } = GameRenderer.useCanvasHoverEvents()

    const inputRef = React.useRef<HTMLInputElement>(null)
    const editGame = React.useRef<Game | null>(null)

    const mapEmpty = () => !round || (round.map.isEmpty() && round.bodies.isEmpty())

    // Total undo stack containing undos for strokes
    const undoStack = React.useRef<RingBuffer<UndoFunction>>(new RingBuffer(UNDO_STACK_SIZE))

    // Current undo stack for the current stroke
    const strokeUndoStack = React.useRef<UndoFunction[]>([])

    const handleUndo = () => {
        if (strokeUndoStack.current.length > 0) {
            const undo = strokeUndoStack.current.pop()
            if (undo) undo()
        } else {
            const undo = undoStack.current.pop()
            if (undo) undo()
        }
        GameRenderer.fullRender()
        setCleared(mapEmpty())
    }
    const clearUndoStack = () => {
        undoStack.current = new RingBuffer(UNDO_STACK_SIZE)
        strokeUndoStack.current = []
    }

    useEffect(() => {
        // Aggregate the current stroke stack into the total stack when the mouse is released
        if (!canvasMouseDown && strokeUndoStack.current.length > 0) {
            const currentStack = strokeUndoStack.current
            undoStack.current.push(() => {
                currentStack.reverse().forEach((undo) => undo && undo())
            })
            strokeUndoStack.current = []
        }
    }, [canvasMouseDown])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                handleUndo()
                event.preventDefault()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [undoStack, round])

    const openBrush = brushes.find((b) => b.open)

    const setOpenBrush = (brush: MapEditorBrush | null) => {
        setBrushes(brushes.map((b) => b.opened(b === brush)))
    }

    const applyBrush = (point: { x: number; y: number }) => {
        if (!openBrush) return

        const undoFunc = openBrush.apply(point.x, point.y, openBrush.fields, true)
        strokeUndoStack.current.push(undoFunc)
        GameRenderer.fullRender()
        setCleared(mapEmpty())
    }

    const changeWidth = (newWidth: number) => {
        newWidth = Math.max(MAP_SIZE_RANGE.min, Math.min(MAP_SIZE_RANGE.max, newWidth))
        setMapParams({ ...mapParams, width: newWidth, imported: null })
        clearUndoStack()
    }
    const changeHeight = (newHeight: number) => {
        newHeight = Math.max(MAP_SIZE_RANGE.min, Math.min(MAP_SIZE_RANGE.max, newHeight))
        setMapParams({ ...mapParams, height: newHeight, imported: null })
        clearUndoStack()
    }
    const changeSymmetry = (symmetry: string) => {
        const symmetryInt = parseInt(symmetry)
        if (symmetryInt < 0 || symmetryInt > 2) throw new Error('invalid symmetry value')
        setMapParams({ ...mapParams, symmetry: symmetryInt, imported: null })
        clearUndoStack()
    }

    const fileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length == 0) return
        const file = e.target.files[0]
        loadFileAsMap(file).then((game) => {
            const map = game.currentMatch!.currentRound!.map
            setMapParams({ width: map.width, height: map.height, symmetry: map.staticMap.symmetry, imported: game })
            clearUndoStack()
        })
    }

    const clearMap = () => {
        setClearConfirmOpen(false)
        setCleared(true)
        setMapParams({ ...mapParams, imported: null })
        clearUndoStack()
    }

    useEffect(() => {
        if (canvasMouseDown && hoveredTile) applyBrush(hoveredTile)
    }, [canvasMouseDown, hoveredTile])

    useEffect(() => {
        if (props.open) {
            if (mapParams.imported) {
                editGame.current = mapParams.imported
            } else if (!editGame.current || mapParams.imported === null) {
                const game = new Game()
                const map = StaticMap.fromParams(mapParams.width, mapParams.height, mapParams.symmetry)
                game.currentMatch = Match.createBlank(game, new Bodies(game), map)
                editGame.current = game
            }

            // A little sus but we need to reset this so the game isn't overridden
            // multiple times
            mapParams.imported = undefined

            GameRunner.setMatch(editGame.current.currentMatch)

            const round = editGame.current.currentMatch!.currentRound
            const brushes = round.map.getEditorBrushes(round).concat(round.bodies.getEditorBrushes(round))
            brushes[0].open = true
            setBrushes(brushes)
            setCleared(round.bodies.isEmpty() && round.map.isEmpty())
        } else {
            GameRunner.setGame(undefined)
        }
    }, [mapParams, props.open])

    // Need to memoize to prevent rerendering that messes up text input
    const renderedBrushes = React.useMemo(() => {
        return brushes.map((brush) => (
            <MapEditorBrushRow
                key={brush.name}
                brush={brush}
                open={brush == openBrush}
                onClick={() => {
                    if (brush == openBrush) setOpenBrush(null)
                    else setOpenBrush(brush)
                }}
            />
        ))
    }, [brushes])

    if (!props.open) return null

    return (
        <>
            <input type="file" hidden ref={inputRef} onChange={fileUploaded} />

            <div className="h-full flex flex-col flex-grow justify-between">
                <div>{renderedBrushes}</div>
                <div className="pb-8">
                    <SmallButton
                        onClick={() => setClearConfirmOpen(true)}
                        className={'mt-2 ' + (cleared ? 'invisible' : '')}
                    >
                        Clear to unlock
                    </SmallButton>
                    <div className={'flex flex-col ' + (cleared ? '' : 'opacity-30 pointer-events-none')}>
                        <div className="flex flex-row items-center justify-center">
                            <span className="mr-2 text-sm">Width: </span>
                            <NumInput
                                value={mapParams.width}
                                changeValue={changeWidth}
                                min={MAP_SIZE_RANGE.min}
                                max={MAP_SIZE_RANGE.max}
                            />
                            <span className="ml-3 mr-2 text-sm">Height: </span>
                            <NumInput
                                value={mapParams.height}
                                changeValue={changeHeight}
                                min={MAP_SIZE_RANGE.min}
                                max={MAP_SIZE_RANGE.max}
                            />
                        </div>
                        <div className="flex flex-row mt-3 items-center justify-center">
                            <span className="mr-5 text-sm">Symmetry: </span>
                            <Select onChange={changeSymmetry} value={mapParams.symmetry}>
                                <option value="0">Rotational</option>
                                <option value="1">Horizontal</option>
                                <option value="2">Vertical</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-row justify-center mt-4 gap-4">
                        <Button
                            className="mx-0"
                            onClick={() => {
                                if (!round) return
                                setMapNameOpen(true)
                            }}
                        >
                            Export
                        </Button>
                        <Button className="mx-0" onClick={() => inputRef.current?.click()}>
                            Import
                        </Button>
                    </div>
                </div>
            </div>

            <InputDialog
                open={mapNameOpen}
                onClose={(name) => {
                    if (!name) {
                        setMapError('')
                        setMapNameOpen(false)
                        return
                    }
                    const error = exportMap(round!, name)
                    setMapError(error)
                    if (!error) setMapNameOpen(false)
                }}
                title="Export Map"
                description="Enter a name for this map"
                placeholder="Name..."
            >
                {mapError && <div className="text-[#ff0000] mt-4">{`Could not export map: ${mapError}`}</div>}
            </InputDialog>

            <ConfirmDialog
                open={clearConfirmOpen}
                onCancel={() => setClearConfirmOpen(false)}
                onConfirm={clearMap}
                title="Clear Map"
                description="Are you sure you want to clear the map? This cannot be undone."
            />
        </>
    )
}
