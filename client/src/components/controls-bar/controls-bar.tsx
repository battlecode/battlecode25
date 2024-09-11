import React, { useEffect } from 'react'
import * as ControlIcons from '../../icons/controls'
import { ControlsBarButton } from './controls-bar-button'
import { useAppContext } from '../../app-context'
import { useKeyboard } from '../../util/keyboard'
import { ControlsBarTimeline } from './controls-bar-timeline'
import { EventType, useListenEvent } from '../../app-events'
import { useForceUpdate } from '../../util/react-util'
import Tooltip from '../tooltip'
import { PageType, usePage } from '../../app-search-params'
import gameRunner, { useGame, useTurn } from '../../playback/GameRunner'

const SIMULATION_UPDATE_INTERVAL_MS = 17 // About 60 fps

export const ControlsBar: React.FC = () => {
    const { state: appState, setState: setAppState } = useAppContext()
    const game = useGame()
    const turn = useTurn()
    const [minimized, setMinimized] = React.useState(false)
    const keyboard = useKeyboard()
    const [page, setPage] = usePage()

    const currentUPSBuffer = React.useRef<number[]>([])

    const currentMatch = turn?.match
    const isPlayable = !!turn && !!game && !!currentMatch
    const hasNextMatch = currentMatch && game!.matches.indexOf(currentMatch!) + 1 < game!.matches.length

    const changePaused = (paused: boolean) => {
        if (!currentMatch) return
        setAppState((prevState) => ({
            ...prevState,
            paused: paused,
            updatesPerSecond: appState.updatesPerSecond == 0 && !paused ? 1 : appState.updatesPerSecond
        }))
    }

    const multiplyUpdatesPerSecond = (multiplier: number) => {
        if (!isPlayable) return
        setAppState((old) => {
            const u = old.updatesPerSecond
            const sign = Math.sign(u * multiplier)
            const newMag = Math.max(1 / 4, Math.min(64, Math.abs(u * multiplier)))
            return { ...old, updatesPerSecond: sign * newMag }
        })
    }

    const stepTurn = (delta: number) => {
        if (!isPlayable) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        currentMatch!.stepTurn(delta, false)
        currentMatch!.roundSimulation()
        currentMatch!.rerender()
    }

    const jumpToTurn = (turn: number) => {
        if (!isPlayable) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        currentMatch!.jumpToTurn(turn, false)
        currentMatch!.roundSimulation()
        currentMatch!.rerender()
    }

    const jumpToEnd = () => {
        if (!isPlayable) return
        // explicit rerender at the end so a render doesnt occur between these two steps
        currentMatch!.jumpToEnd(false)
        currentMatch!.roundSimulation()
        currentMatch!.rerender()
    }

    const nextMatch = () => {
        if (!isPlayable) return
        const prevMatch = game.currentMatch!
        const prevMatchIndex = game.matches.indexOf(prevMatch)
        if (prevMatchIndex + 1 == game.matches.length) {
            closeGame()
            return
        }

        setAppState((prevState) => ({
            ...prevState
        }))
        gameRunner.selectMatch(game.matches[prevMatchIndex + 1])
    }

    const closeGame = () => {
        setAppState((prevState) => ({
            ...prevState
        }))
        gameRunner.setGame(undefined)
        if (appState.tournament) setPage(PageType.TOURNAMENT)
    }

    React.useEffect(() => {
        // We want to pause whenever the match changes
        changePaused(true)
    }, [currentMatch])

    React.useEffect(() => {
        if (!isPlayable) return
        if (appState.paused) {
            // Snap bots to their actual position when paused by rounding simulation
            // to the true turn
            currentMatch!.roundSimulation()
            currentMatch!.rerender()
            return
        }

        const msPerUpdate = 1000 / appState.updatesPerSecond
        const updatesPerInterval = SIMULATION_UPDATE_INTERVAL_MS / msPerUpdate
        const stepInterval = setInterval(() => {
            const prevTurn = currentMatch!.currentTurn.turnNumber
            currentMatch!.stepSimulation(updatesPerInterval)

            if (prevTurn != currentMatch!.currentTurn.turnNumber) {
                currentUPSBuffer.current.push(Date.now())
                while (currentUPSBuffer.current.length > 0 && currentUPSBuffer.current[0] < Date.now() - 1000)
                    currentUPSBuffer.current.shift()
            }

            if (currentMatch!.currentTurn.isEnd() && appState.updatesPerSecond > 0) {
                changePaused(true)
            }
        }, SIMULATION_UPDATE_INTERVAL_MS)

        return () => {
            clearInterval(stepInterval)
        }
    }, [appState.updatesPerSecond, game, currentMatch, appState.paused])

    useEffect(() => {
        if (appState.disableHotkeys) return

        // If the competitor had manually pressed one of the buttons on the
        // control bar before using a shortcut, unselect it; Most browsers have
        // specific accessibility features that mess with these shortcuts.
        if (keyboard.targetElem instanceof HTMLButtonElement) keyboard.targetElem.blur()

        if (keyboard.keyCode === 'Space') changePaused(!appState.paused)

        if (keyboard.keyCode === 'KeyC') setMinimized(!minimized)

        const applyArrows = () => {
            if (appState.paused) {
                if (keyboard.keyCode === 'ArrowRight') stepTurn(1)
                if (keyboard.keyCode === 'ArrowLeft') stepTurn(-1)
            } else {
                if (keyboard.keyCode === 'ArrowRight') multiplyUpdatesPerSecond(2)
                if (keyboard.keyCode === 'ArrowLeft') multiplyUpdatesPerSecond(0.5)
            }
        }
        applyArrows()

        if (keyboard.keyCode === 'Comma') jumpToTurn(0)
        if (keyboard.keyCode === 'Period') jumpToEnd()

        const initalDelay = 250
        const repeatDelay = 100
        const timeouts: { initialTimeout: NodeJS.Timeout; repeatedFire?: NodeJS.Timeout } = {
            initialTimeout: setTimeout(() => {
                timeouts.repeatedFire = setInterval(applyArrows, repeatDelay)
            }, initalDelay)
        }
        return () => {
            clearTimeout(timeouts.initialTimeout)
            clearInterval(timeouts.repeatedFire)
        }
    }, [keyboard.keyCode])

    if (!isPlayable) return null

    const atStart = turn.turnNumber == 0
    const atEnd = turn.turnNumber == currentMatch.maxTurn

    return (
        <div
            className="flex absolute bottom-0 rounded-t-md z-10 pointer-events-none select-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
            <Tooltip text={minimized ? 'Open Controls (c)' : 'Close Controls (c)'} wrapperClass="pointer-events-auto">
                <button
                    className={
                        (minimized ? 'text-darkHighlight opacity-90' : 'ml-[1px] text-white') +
                        ' z-20 absolute left-0 top-0 rounded-md text-[10px] aspect-[1] w-[15px] flex justify-center font-bold select-none'
                    }
                    onClick={() => setMinimized(!minimized)}
                >
                    {minimized ? '+' : '-'}
                </button>
            </Tooltip>
            <div
                className={
                    (minimized ? 'opacity-10 pointer-events-none' : 'opacity-90 pointer-events-auto') +
                    ' flex bg-darkHighlight text-white p-1.5 rounded-t-md z-10 gap-1.5 relative'
                }
            >
                <ControlsBarTimeline currentUPS={currentUPSBuffer.current.length} />
                <ControlsBarButton
                    icon={<ControlIcons.ReverseIcon />}
                    tooltip="Reverse"
                    onClick={() => multiplyUpdatesPerSecond(-1)}
                />
                <ControlsBarButton
                    icon={<ControlIcons.SkipBackwardsIcon />}
                    tooltip={'Decrease Speed'}
                    onClick={() => multiplyUpdatesPerSecond(0.5)}
                    disabled={Math.abs(appState.updatesPerSecond) <= 0.25}
                />
                <ControlsBarButton
                    icon={<ControlIcons.GoPreviousIcon />}
                    tooltip="Step Backwards"
                    onClick={() => stepTurn(-1)}
                    disabled={atStart}
                />
                {appState.paused ? (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPlayIcon />}
                        tooltip="Play"
                        onClick={() => {
                            changePaused(false)
                        }}
                    />
                ) : (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPauseIcon />}
                        tooltip="Pause"
                        onClick={() => {
                            changePaused(true)
                        }}
                    />
                )}
                <ControlsBarButton
                    icon={<ControlIcons.GoNextIcon />}
                    tooltip="Next Turn"
                    onClick={() => stepTurn(1)}
                    disabled={atEnd}
                />
                <ControlsBarButton
                    icon={<ControlIcons.SkipForwardsIcon />}
                    tooltip={'Increase Speed'}
                    onClick={() => multiplyUpdatesPerSecond(2)}
                    disabled={Math.abs(appState.updatesPerSecond) >= 64}
                />
                <ControlsBarButton
                    icon={<ControlIcons.PlaybackStopIcon />}
                    tooltip="Jump To Start"
                    onClick={() => jumpToTurn(0)}
                    disabled={atStart}
                />
                <ControlsBarButton
                    icon={<ControlIcons.GoEndIcon />}
                    tooltip="Jump To End"
                    onClick={jumpToEnd}
                    disabled={atEnd}
                />
                {appState.tournament && (
                    <>
                        <ControlsBarButton
                            icon={<ControlIcons.NextMatch />}
                            tooltip="Next Match"
                            onClick={nextMatch}
                            disabled={!hasNextMatch}
                        />
                        <ControlsBarButton icon={<ControlIcons.CloseGame />} tooltip="Close Game" onClick={closeGame} />
                    </>
                )}
            </div>
        </div>
    )
}
