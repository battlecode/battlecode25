import React, { useRef } from 'react'
import { useAppContext } from '../../app-context'
import gameRunner, { useCurrentUPS, useMatch } from '../../playback/GameRunner'
import { GAME_MAX_TURNS } from '../../constants'

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
            {markers.map((marker) => {
                const position = (marker.round / maxRound) * TIMELINE_WIDTH
                const isActive = currentRound >= marker.round

                return (
                    <div key={marker.phase} className="absolute group" style={{ left: `${position}px` }}>
                        {/* Clickable area */}
                        <div
                            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-20"
                            onClick={() => gameRunner.jumpToRound(marker.round)}
                            style={{ top: '0px' }}
                        >
                            {/* Visible marker */}
                            <div
                                className={`absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 
                                    rounded-full transition-colors
                                    ${isActive ? 'bg-gray-300' : 'bg-gray-400'}
                                    group-hover:bg-blue-400`}
                            />
                        </div>

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
    const match = useMatch()
    const down = useRef(false)

    const maxRound = match ? (appContext.state.tournament ? GAME_MAX_TURNS : match.maxRound) : GAME_MAX_TURNS

    const timelineClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const round = Math.floor((x / TIMELINE_WIDTH) * maxRound)
        gameRunner.jumpToRound(round)
    }

    const timelineHover = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!down.current) return
        timelineClick(e)
    }

    const timelineDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        down.current = true
        timelineClick(e)
    }

    const timelineUp = () => {
        down.current = false
    }

    const timelineEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.buttons === 1) timelineDown(e)
    }

    const timelineLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (down.current) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x <= 0) {
                gameRunner.jumpToRound(0)
            } else if (x >= rect.width) {
                gameRunner.jumpToEnd()
            }
        }
        timelineUp()
    }

    if (!match) {
        return (
            <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[9px] text-xs pointer-events-none">
                    Upload Game File
                </p>
                <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded" />
            </div>
        )
    }

    const round = match.currentRound.roundNumber
    const roundPercentage = () => (1 - round / maxRound) * 100 + '%'

    return (
        <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-xs select-none whitespace-nowrap">
                Round: <b>{round}</b>/{maxRound} &nbsp; {targetUPS} UPS ({targetUPS < 0 && '-'}
                {currentUPS})
            </p>
            <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded" />
            <div
                className="absolute bg-white/90 left-0 bottom-0 min-h-[5px] rounded min-w-[5px]"
                style={{ right: roundPercentage() }}
            />

            <TimelineMarkers currentRound={round} maxRound={maxRound} />

            <div
                className="absolute left-0 right-0 top-0 bottom-0 cursor-pointer"
                onMouseMove={timelineHover}
                onMouseDown={timelineDown}
                onMouseUp={timelineUp}
                onMouseLeave={timelineLeave}
                onMouseEnter={timelineEnter}
            />
        </div>
    )
}
