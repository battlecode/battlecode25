import React, { useEffect } from 'react'
import { StaticMap } from '../../../playback/Map'
import { MapEditorBrushRow } from './map-editor-brushes'
import Bodies from '../../../playback/Bodies'
import Game from '../../../playback/Game'
import { Button, BrightButton, SmallButton } from '../../button'
import { NumInput, Select } from '../../forms'
import { useAppContext } from '../../../app-context'
import Match from '../../../playback/Match'
import { EventType, publishEvent, useListenEvent } from '../../../app-events'
import { MapEditorBrush } from './MapEditorBrush'
import { exportMap, loadFileAsMap } from './MapGenerator'
import { MAP_SIZE_RANGE } from '../../../constants'
import { InputDialog } from '../../input-dialog'
import { ConfirmDialog } from '../../confirm-dialog'
import gameRunner, { useTurn } from '../../../playback/GameRunner'

type MapParams = {
    width: number
    height: number
    symmetry: number
    imported?: Game | null
}

interface Props {
    open: boolean
}

export const MapEditorPage: React.FC<Props> = (props) => {
    const context = useAppContext()
    const turn = useTurn()
    const [cleared, setCleared] = React.useState(true)
    const [mapParams, setMapParams] = React.useState<MapParams>({ width: 30, height: 30, symmetry: 0 })
    const [brushes, setBrushes] = React.useState<MapEditorBrush[]>([])
    const [mapNameOpen, setMapNameOpen] = React.useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false)
    const [mapError, setMapError] = React.useState('')

    const inputRef = React.useRef<HTMLInputElement>(null)
    const editGame = React.useRef<Game | null>(null)

    const openBrush = brushes.find((b) => b.open)

    const setOpenBrush = (brush: MapEditorBrush | null) => {
        setBrushes(brushes.map((b) => b.opened(b === brush)))
    }

    const mapEmpty = () => !turn || (turn.map.isEmpty() && turn.bodies.isEmpty())

    const applyBrush = (point: { x: number; y: number }) => {
        if (!openBrush) return

        openBrush.apply(point.x, point.y, openBrush.fields)
        publishEvent(EventType.INITIAL_RENDER, {})
        setCleared(mapEmpty())
    }

    const changeWidth = (newWidth: number) => {
        newWidth = Math.max(MAP_SIZE_RANGE.min, Math.min(MAP_SIZE_RANGE.max, newWidth))
        setMapParams({ ...mapParams, width: newWidth, imported: null })
    }
    const changeHeight = (newHeight: number) => {
        newHeight = Math.max(MAP_SIZE_RANGE.min, Math.min(MAP_SIZE_RANGE.max, newHeight))
        setMapParams({ ...mapParams, height: newHeight, imported: null })
    }
    const changeSymmetry = (symmetry: string) => {
        const symmetryInt = parseInt(symmetry)
        if (symmetryInt < 0 || symmetryInt > 2) throw new Error('invalid symmetry value')
        setMapParams({ ...mapParams, symmetry: symmetryInt, imported: null })
    }

    const fileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length == 0) return
        const file = e.target.files[0]
        loadFileAsMap(file).then((game) => {
            const map = game.currentMatch!.currentTurn!.map
            setMapParams({ width: map.width, height: map.height, symmetry: map.staticMap.symmetry, imported: game })
        })
    }

    const clearMap = () => {
        setClearConfirmOpen(false)
        setCleared(true)
        setMapParams({ ...mapParams, imported: null })
    }

    useListenEvent(EventType.TILE_CLICK, applyBrush, [brushes])
    useListenEvent(EventType.TILE_DRAG, applyBrush, [brushes])

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

            gameRunner.setGame(editGame.current)
            gameRunner.setMatch(editGame.current.currentMatch)

            const turn = editGame.current.currentMatch!.currentTurn
            const brushes = turn.map.getEditorBrushes().concat(turn.bodies.getEditorBrushes(turn.map.staticMap))
            brushes[0].open = true
            setBrushes(brushes)
            setCleared(turn.bodies.isEmpty() && turn.map.isEmpty())
        } else {
            gameRunner.setGame(undefined)
        }
    }, [mapParams, props.open])

    // Need to memoize to prevent rerendering that messes up text input
    const renderedBrushes = React.useMemo(() => {
        return brushes.map((brush) => (
            <MapEditorBrushRow
                key={JSON.stringify(brush)}
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

            <div className="flex flex-col flex-grow">
                {renderedBrushes}
                <SmallButton
                    onClick={() => setClearConfirmOpen(true)}
                    className={'mt-10 ' + (cleared ? 'invisible' : '')}
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

                <div className="flex flex-row mt-8">
                    <BrightButton
                        onClick={() => {
                            if (!turn) return
                            setMapNameOpen(true)
                        }}
                    >
                        Export
                    </BrightButton>
                    <Button onClick={() => inputRef.current?.click()}>Import</Button>
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
                    const error = exportMap(turn!, name)
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
