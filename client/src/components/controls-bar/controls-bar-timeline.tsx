import React, { useRef } from 'react';
import { useAppContext } from '../../app-context';
import gameRunner, { useCurrentUPS, useMatch } from '../../playback/GameRunner';
import { GAME_MAX_TURNS } from '../../constants';

const TIMELINE_WIDTH = 350;

interface TimelineMarker {
    round: number;
    label?: string;
}

interface Props {
    targetUPS: number;
}

const TimelineMarkers: React.FC<{ markers: TimelineMarker[]; maxRound: number }> = ({ markers, maxRound }) => {
    return (
        <div className="absolute left-0 right-0 bottom-[5px] h-[15px]">
            {markers.map((marker, index) => {
                const position = (marker.round / maxRound) * TIMELINE_WIDTH;
                return (
                    <div
                        key={index}
                        className="group relative"
                    >
                        <div
                            className="absolute w-2 h-2 bg-blue-500 rounded-full -translate-x-1 hover:bg-blue-400 transition-colors cursor-pointer"
                            style={{
                                left: `${position}px`,
                                bottom: '5px'
                            }}
                        />
                        <div
                            className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap"
                            style={{
                                left: `${position}px`,
                            }}
                        >
                            {marker.label || `Round ${marker.round}`}
                            <div 
                                className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: '-4px'
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const ControlsBarTimeline: React.FC<Props> = ({ targetUPS }) => {
    const appContext = useAppContext();
    const currentUPS = useCurrentUPS();
    const match = useMatch();
    const down = useRef(false);

    const markers = appContext.state.timelineMarkers || [];
    
    // Ensure maxRound is always a number
    const maxRound = match ? (appContext.state.tournament ? GAME_MAX_TURNS : match.maxRound) : GAME_MAX_TURNS;

    const timelineClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const round = Math.floor((x / TIMELINE_WIDTH) * maxRound);
        gameRunner.jumpToRound(round);
    };

    const timelineHover = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!down.current) return;
        timelineClick(e);
    };

    const timelineDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        down.current = true;
        timelineClick(e);
    };

    const timelineUp = () => {
        down.current = false;
    };

    const timelineEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.buttons === 1) timelineDown(e);
    };

    const timelineLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (down.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x <= 0) {
                gameRunner.jumpToRound(0);
            } else if (x >= rect.width) {
                gameRunner.jumpToEnd();
            }
        }
        timelineUp();
    };

    if (!match) {
        return (
            <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[9px] text-xs pointer-events-none">
                    Upload Game File
                </p>
                <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            </div>
        );
    }

    const round = match.currentRound.roundNumber;
    const roundPercentage = () => (1 - round / maxRound) * 100 + '%';

    return (
        <div className="min-h-[30px] bg-bg rounded-md mr-2 relative" style={{ minWidth: TIMELINE_WIDTH }}>
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] text-xs select-none whitespace-nowrap">
                Round: <b>{round}</b>/{maxRound} &nbsp; {targetUPS} UPS ({targetUPS < 0 && '-'}
                {currentUPS})
            </p>
            <div className="absolute bg-white/10 left-0 right-0 bottom-0 min-h-[5px] rounded"></div>
            <div
                className="absolute bg-white/90 left-0 bottom-0 min-h-[5px] rounded min-w-[5px]"
                style={{ right: roundPercentage() }}
            />

            <TimelineMarkers markers={markers} maxRound={maxRound} />

            <div
                className="absolute left-0 right-0 top-0 bottom-0 z-[1] cursor-pointer"
                onMouseMove={timelineHover}
                onMouseDown={timelineDown}
                onMouseUp={timelineUp}
                onMouseLeave={timelineLeave}
                onMouseEnter={timelineEnter}
            />
        </div>
    );
};