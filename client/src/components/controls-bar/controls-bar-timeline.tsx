import React, { useRef } from 'react'
import { useAppContext } from '../../app-context'
import GameRunner, { useCurrentUPS, usePlaybackPerTurn, useRound, useTurnNumber } from '../../playback/GameRunner'
import { GAME_MAX_TURNS } from '../../constants'
import assert from 'assert'

const TIMELINE_WIDTH = 350

interface TimelineMarker {
    round: number
    phase: number
    description: string
}

const markers: TimelineMarker[] = [
    { round: 0, phase: 1, description: 'Game Start' },
    { round: Math.floor(GAME_MAX_TURNS * 0.25), phase: 2, description: 'Early Game' },
    { round: Math.floor(GAME_MAX_TURNS * 0.5), phase: 3, description: 'Mid Game' },
    { round: Math.floor(GAME_MAX_TURNS * 0.75), phase: 4, description: 'Late Game' },
    { round: GAME_MAX_TURNS - 1, phase: 5, description: 'End Game' }
]

interface Props {
    targetUPS: number
}

interface MarkerProps {
    currentRound: number
    maxRound: number
}

const TimelineMarkers: React.FC<MarkerProps> = ({ currentRound, maxRound }) => {
    return (
        <div className="absolute left-0 right-0 bottom-[2.5px] pointer-events-none">
            {markers.map((marker, i) => {
                const position = (marker.round / maxRound) * TIMELINE_WIDTH
                const isActive = currentRound >= marker.round

                return (
                    <div key={i} className="absolute group" style={{ left: `${position}px` }}>
                        {/* Clickable area */}
                        <div
                            className="absolute w-1 h-2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-20"
                            onClick={() => GameRunner.jumpToRound(marker.round)}
                        />

                        {/* Visible marker */}
                        <div
                            className={`absolute top-1/2 left-1/2 w-1 h-2 -translate-x-1/2 -translate-y-1/2 pointer-events-none
                                    rounded-[50px] transition-colors
                                    ${isActive ? 'bg-gray-300' : 'bg-gray-400'}
                                    group-hover:bg-blue-400`}
                            style={{ boxShadow: '0 0 2px #00000088' }}
                        />

                        {/* Tooltip */}
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none"
                            style={{ bottom: '15px', left: '0', transform: 'translateX(-50%)' }}
                        >
                            <div className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap">
                                <div className="font-bold">Phase {marker.phase}</div>
                                <div className="text-gray-300">{marker.description}</div>
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
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
                <Timeline
                    showMarkers={appContext.state.config.showTimelineMarkers}
                    value={round.roundNumber}
                    max={maxRound}
                    onClick={(progress) => {
                        GameRunner.jumpToRound(round.match.progressToRoundNumber(progress))
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
                            if (turn === round.turnsLength) GameRunner.stepRound(1)
                            else GameRunner.jumpToTurn(turn)
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
    showMarkers?: boolean
}> = ({ children, value, max, onClick, showMarkers }) => {
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

            {showMarkers && <TimelineMarkers currentRound={value} maxRound={max} />}

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
