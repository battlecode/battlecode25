import React, { useEffect } from 'react'
import * as ControlIcons from '../../icons/controls'
import { ControlsBarButton } from './controls-bar-button'
import { useAppContext } from '../../app-context'
import { useKeyboard } from '../../util/keyboard'
import { ControlsBarTimeline } from './controls-bar-timeline'
import { EventType, useListenEvent } from '../../app-events'
import { useForceUpdate } from '../../util/react-util'
import Tooltip from '../tooltip'
import Match from '../../playback/Match'

type ControlsBarProps = {
    match: Match | undefined
    paused: boolean
    setPaused: (paused: boolean) => void
    targetUPS: number
    liveUPS: number
    setTargetUPS: (targetUPS: number) => void
    nextMatch: () => void
    closeGame: () => void
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
    match,
    paused,
    setPaused,
    targetUPS,
    setTargetUPS,
    liveUPS,
    nextMatch,
    closeGame
}) => {
    const { state: appState, setState: setAppState } = useAppContext()
    const [minimized, setMinimized] = React.useState(false)
    const keyboard = useKeyboard()

    const forceUpdate = useForceUpdate()
    useListenEvent(EventType.TURN_PROGRESS, forceUpdate)

    const hasNextMatch = match && match.game.matches.indexOf(match!) + 1 < match.game.matches.length

    const multiplyUpdatesPerSecond = (multiplier: number) => {
        if (!match?.isPlayable()) return
        const sign = Math.sign(targetUPS * multiplier)
        const newMag = Math.max(1 / 4, Math.min(64, Math.abs(targetUPS * multiplier)))
        setTargetUPS(sign * newMag)
    }

    const stepTurn = (delta: number) => {
        if (!match?.isPlayable()) return
        match.stepTurn(delta, false) // false to not rerender here, so we can round first
        match.roundSimulation()
        match.rerender()
    }

    const jumpToTurn = (turn: number) => {
        if (!match?.isPlayable()) return
        match.jumpToTurn(turn, false) // false to not rerender here, so we can round first
        match.roundSimulation()
        match.rerender()
    }

    const jumpToEnd = () => {
        if (!match?.isPlayable()) return
        match.jumpToEnd(false) // false to not rerender here, so we can round first
        match.roundSimulation()
        match.rerender()
    }

    useEffect(() => {
        if (appState.disableHotkeys) return

        // If the competitor had manually pressed one of the buttons on the
        // control bar before using a shortcut, unselect it; Most browsers have
        // specific accessibility features that mess with these shortcuts.
        if (keyboard.targetElem instanceof HTMLButtonElement) keyboard.targetElem.blur()

        if (keyboard.keyCode === 'Space' && match) setPaused(!paused)

        if (keyboard.keyCode === 'KeyC') setMinimized(!minimized)

        const applyArrows = () => {
            if (paused) {
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

    if (!match?.isPlayable()) return null

    const atStart = match.currentTurn.turnNumber == 0
    const atEnd = match.currentTurn.turnNumber == match.maxTurn

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
                <ControlsBarTimeline liveUPS={liveUPS} targetUPS={targetUPS} />
                <ControlsBarButton
                    icon={<ControlIcons.ReverseIcon />}
                    tooltip="Reverse"
                    onClick={() => multiplyUpdatesPerSecond(-1)}
                />
                <ControlsBarButton
                    icon={<ControlIcons.SkipBackwardsIcon />}
                    tooltip={'Decrease Speed'}
                    onClick={() => multiplyUpdatesPerSecond(0.5)}
                    disabled={Math.abs(targetUPS) <= 0.25}
                />
                <ControlsBarButton
                    icon={<ControlIcons.GoPreviousIcon />}
                    tooltip="Step Backwards"
                    onClick={() => stepTurn(-1)}
                    disabled={atStart}
                />
                {paused ? (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPlayIcon />}
                        tooltip="Play"
                        onClick={() => {
                            setPaused(false)
                        }}
                    />
                ) : (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPauseIcon />}
                        tooltip="Pause"
                        onClick={() => {
                            setPaused(true)
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
                    disabled={Math.abs(targetUPS) >= 64}
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
