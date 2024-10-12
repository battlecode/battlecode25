import React, { useRef } from 'react'
import { useAppContext } from '../../app-context'
import GameRunner, { useCurrentUPS, useMatch } from '../../playback/GameRunner'

const TIMELINE_WIDTH = 350
interface Props {
    targetUPS: number
}

export const ControlsBarTimeline: React.FC<Props> = ({ targetUPS }) => {
    const appContext = useAppContext()
    const currentUPS = useCurrentUPS()
    const match = useMatch()

    let down = useRef(false)
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
        if (down.current) {
            // if exiting from left or right, jump to min or max turn
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x <= 0) {
                GameRunner.jumpToTurn(0)
            } else if (x >= rect.width) {
                GameRunner.jumpToEnd()
            }
        }
        timelineUp(e)
    }

    // TODO: should have a defined constant somewhere else
    const maxTurn = appContext.state.tournament ? 2000 : match!.maxTurn

    const timelineClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const turn = Math.floor((x / TIMELINE_WIDTH) * maxTurn)
        GameRunner.jumpToTurn(turn)
    }

    if (!match)
        return (
            <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[9px] text-xs pointer-events-none">
                    Upload Game File
                </p>
                <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            </div>
        )

    const turn = match!.currentTurn.turnNumber
    const turnPercentage = () => (1 - turn / maxTurn) * 100 + '%'
    return (
        <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-xs select-none whitespace-nowrap">
                Turn: <b>{turn}</b>/{maxTurn} &nbsp; {targetUPS} UPS ({targetUPS < 0 && '-'}
                {currentUPS})
            </p>
            <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            <div
                className="absolute bg-white/90 left-0 bottom-0 min-h-[5px] rounded min-w-[5px]"
                style={{ right: turnPercentage() }}
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
