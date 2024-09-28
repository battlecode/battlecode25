import React, { useEffect } from 'react'
import * as ControlIcons from '../../icons/controls'
import { ControlsBarButton } from './controls-bar-button'
import { useAppContext } from '../../app-context'
import { useKeyboard } from '../../util/keyboard'
import { ControlsBarTimeline } from './controls-bar-timeline'
import Tooltip from '../tooltip'
import gameRunner, { useControls, useTurn } from '../../playback/GameRunner'

export const ControlsBar: React.FC = () => {
    const { state: appState } = useAppContext()
    const turn = useTurn()
    const [minimized, setMinimized] = React.useState(false)
    const keyboard = useKeyboard()
    const { paused, targetUPS } = useControls()

    const hasNextMatch = turn && turn?.match.game.matches.indexOf(turn.match!) + 1 < turn.match.game.matches.length

    useEffect(() => {
        if (appState.disableHotkeys) return

        // If the competitor had manually pressed one of the buttons on the
        // control bar before using a shortcut, unselect it; Most browsers have
        // specific accessibility features that mess with these shortcuts.
        if (keyboard.targetElem instanceof HTMLButtonElement) keyboard.targetElem.blur()

        if (keyboard.keyCode === 'Space') gameRunner.setPaused(!paused)

        if (keyboard.keyCode === 'KeyC') setMinimized(!minimized)

        const applyArrows = () => {
            if (paused) {
                if (keyboard.keyCode === 'ArrowRight') gameRunner.stepTurn(1)
                if (keyboard.keyCode === 'ArrowLeft') gameRunner.stepTurn(-1)
            } else {
                if (keyboard.keyCode === 'ArrowRight') gameRunner.multiplyUpdatesPerSecond(2)
                if (keyboard.keyCode === 'ArrowLeft') gameRunner.multiplyUpdatesPerSecond(0.5)
            }
        }
        applyArrows()

        if (keyboard.keyCode === 'Comma') gameRunner.jumpToTurn(0)
        if (keyboard.keyCode === 'Period') gameRunner.jumpToEnd()

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

    if (!turn) return null

    const atStart = turn.turnNumber == 0
    const atEnd = turn.turnNumber == turn.match.maxTurn

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
                <ControlsBarTimeline targetUPS={targetUPS} />
                <ControlsBarButton
                    icon={<ControlIcons.ReverseIcon />}
                    tooltip="Reverse"
                    onClick={() => gameRunner.multiplyUpdatesPerSecond(-1)}
                />
                <ControlsBarButton
                    icon={<ControlIcons.SkipBackwardsIcon />}
                    tooltip={'Decrease Speed'}
                    onClick={() => gameRunner.multiplyUpdatesPerSecond(0.5)}
                    disabled={Math.abs(targetUPS) <= 0.25}
                />
                <ControlsBarButton
                    icon={<ControlIcons.GoPreviousIcon />}
                    tooltip="Step Backwards"
                    onClick={() => gameRunner.stepTurn(-1)}
                    disabled={atStart}
                />
                {paused ? (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPlayIcon />}
                        tooltip="Play"
                        onClick={() => {
                            gameRunner.setPaused(false)
                        }}
                    />
                ) : (
                    <ControlsBarButton
                        icon={<ControlIcons.PlaybackPauseIcon />}
                        tooltip="Pause"
                        onClick={() => {
                            gameRunner.setPaused(true)
                        }}
                    />
                )}
                <ControlsBarButton
                    icon={<ControlIcons.GoNextIcon />}
                    tooltip="Next Turn"
                    onClick={() => gameRunner.stepTurn(1)}
                    disabled={atEnd}
                />
                <ControlsBarButton
                    icon={<ControlIcons.SkipForwardsIcon />}
                    tooltip={'Increase Speed'}
                    onClick={() => gameRunner.multiplyUpdatesPerSecond(2)}
                    disabled={Math.abs(targetUPS) >= 64}
                />
                <ControlsBarButton
                    icon={<ControlIcons.PlaybackStopIcon />}
                    tooltip="Jump To Start"
                    onClick={() => gameRunner.jumpToTurn(0)}
                    disabled={atStart}
                />
                <ControlsBarButton
                    icon={<ControlIcons.GoEndIcon />}
                    tooltip="Jump To End"
                    onClick={() => gameRunner.jumpToEnd()}
                    disabled={atEnd}
                />
                {appState.tournament && (
                    <>
                        <ControlsBarButton
                            icon={<ControlIcons.NextMatch />}
                            tooltip="Next Match"
                            onClick={() => gameRunner.nextMatch()}
                            disabled={!hasNextMatch}
                        />
                        <ControlsBarButton
                            icon={<ControlIcons.CloseGame />}
                            tooltip="Close Game"
                            onClick={() => gameRunner.setGame(undefined)}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
