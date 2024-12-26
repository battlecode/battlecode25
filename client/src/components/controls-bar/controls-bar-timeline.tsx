import React, { useRef } from 'react'
import { useAppContext } from '../../app-context'
import gameRunner, { useCurrentUPS, usePlaybackPerTurn, useRound, useTurnNumber } from '../../playback/GameRunner'
import { GAME_MAX_TURNS } from '../../constants'
import assert from 'assert'

const TIMELINE_WIDTH = 350
interface Props {
    targetUPS: number
}

export const ControlsBarTimeline: React.FC<Props> = ({ targetUPS }) => {
    const appContext = useAppContext()
    const currentUPS = useCurrentUPS()
    const playbackPerTurn = usePlaybackPerTurn()
    const round = useRound()
    const turn = useTurnNumber()

    if (!round)
        return (
            <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[9px] text-xs pointer-events-none">
                    Upload Game File
                </p>
                <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            </div>
        )

    assert(turn, 'turn is undefined for defined match')
    const maxRound = appContext.state.tournament ? GAME_MAX_TURNS : round.match.maxRound

    const ups = (
        <>
            &nbsp; {targetUPS} UPS ({targetUPS < 0 && '-'}
            {currentUPS})
        </>
    )
    return (
        <>
            <div className="flex flex-col">
                {/* <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
                    <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-xs select-none whitespace-nowrap">
                        Round: <b>{round}</b>/{maxRound} &nbsp; {targetUPS} UPS ({targetUPS < 0 && '-'}
                        {currentUPS})
                    </p>
                    <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
                    <div
                        className="absolute bg-white/90 left-0 bottom-0 min-h-[5px] rounded min-w-[5px]"
                        style={{ right: roundPercentage() }}
                    ></div>
                    <div
                        className="absolute left-0 right-0 top-0 bottom-0 z-index-1 cursor-pointer"
                        onMouseMove={timelineHover}
                        onMouseDown={timelineDown}
                        onMouseUp={timelineUp}
                        onMouseLeave={timelineLeave}
                        onMouseEnter={tilelineEnter}
                    ></div>
                </div> */}
                <Timeline
                    value={round.roundNumber}
                    max={maxRound}
                    onClick={(progress) => {
                        gameRunner.jumpToRound(round.match.progressToRoundNumber(progress))
                    }}
                >
                    Round: <b>{round.roundNumber}</b>/{maxRound} {!playbackPerTurn && ups}
                </Timeline>

                {playbackPerTurn && (
                    <Timeline
                        value={turn.current}
                        max={turn.max}
                        onClick={(progress) => {
                            const turn = round.match.progressToTurnNumber(progress)
                            if (turn === round.turnsLength) gameRunner.stepRound(1)
                            else gameRunner.jumpToTurn(turn)
                        }}
                    >
                        Turn: <b>{turn.current}</b>/{turn.max} {ups}
                    </Timeline>
                )}
            </div>
        </>
    )
}

export const Timeline: React.FC<{
    children: React.ReactNode
    value: number
    max: number
    onClick: (value: number) => void
}> = ({ children, value, max, onClick }) => {
    const down = useRef(false)
    const timelineHover = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!down.current) return
        timelineClick(e)
    }
    const timelineDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        down.current = true
        timelineClick(e)
    }
    const timelineUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        down.current = false
    }
    const tilelineEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.buttons === 1) timelineDown(e)
    }
    const timelineLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const EDGES_PADDING = 2
        if (down.current) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x <= EDGES_PADDING) {
                onClick(0)
            } else if (x >= rect.width - EDGES_PADDING) {
                onClick(1)
            }
        }
        timelineUp(e)
    }
    const timelineClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        onClick(Math.max(0, Math.min(1, x / TIMELINE_WIDTH)))
    }

    return (
        <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-xs select-none whitespace-nowrap">
                {children}
            </p>
            <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            <div
                className="absolute bg-white/90 left-0 bottom-0 min-h-[5px] rounded min-w-[5px]"
                style={{ right: (1 - value / max) * 100 + '%' }}
            ></div>
            <div
                className="absolute left-0 right-0 top-0 bottom-0 z-index-1 cursor-pointer"
                onMouseMove={timelineHover}
                onMouseDown={timelineDown}
                onMouseUp={timelineUp}
                onMouseLeave={timelineLeave}
                onMouseEnter={tilelineEnter}
            ></div>
        </div>
    )
}
