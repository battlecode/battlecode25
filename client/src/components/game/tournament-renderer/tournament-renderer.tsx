import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../../app-context'
import { TournamentGameElement } from './tournament-game'
import { Space } from 'react-zoomable-ui'
import { useSearchParamNumber } from '../../../app-search-params'
import Tournament, { TournamentState, TournamentGame } from './Tournament';

export const TournamentRenderer: React.FC = () => {
    const appContext = useAppContext()

    const spaceRef = useRef<Space | null>(null)

    const [tournamentWinnerStart] = useSearchParamNumber('tournamentWinnerStart', 0)
    const [tournamentLoserStart] = useSearchParamNumber('tournamentLoserStart', 0)

    const tournament = appContext.state.tournament
    const tournamentState = appContext.state.tournamentState

    return (
        <div className="w-full h-screen relative">
            <Space ref={spaceRef} treatTwoFingerTrackPadGesturesLikeTouch={false}>
                {tournament && spaceRef.current ? (
                    <TournamentTree
                        tournament={tournament}
                        tournamentState={tournamentState}
                        spaceRef={spaceRef.current}
                        winnerStart={tournamentWinnerStart}
                        loserStart={tournamentLoserStart}
                    />
                ) : (
                    <>Missing Tournament</>
                )}
            </Space>
        </div>
    )
}

interface TournamentTreeProps {
    tournament: Tournament
    tournamentState: TournamentState
    spaceRef: Space
    winnerStart: number
    loserStart: number
}

const TournamentTree: React.FC<TournamentTreeProps> = (props) => {
    // const [leafWidth, setLeafWidth] = useState<number | undefined>(undefined)
    // const leafRef = useRef<HTMLDivElement>(null)

    // React.useEffect(() => {
    //     if (!leafRef.current) throw new Error('tournament has no round 1 games')
    //     setLeafWidth(leafRef.current.offsetWidth)
    //     const resizeObserver = new ResizeObserver(() => {
    //         if (leafRef.current) setLeafWidth(leafRef.current.offsetWidth)
    //     })
    //     resizeObserver.observe(leafRef.current)
    // }, [])

    const brackets: [TournamentGame, string][] = [
        [props.tournament.winnersBracketRoot, props.tournament.losersBracketRoot ? 'Winners Bracket' : '']
    ]
    if (props.tournament.losersBracketRoot && props.tournamentState.showLosers)
        brackets.push([props.tournament.losersBracketRoot, 'Losers Bracket'])

    return (
        <div className="flex flex-row gap-10 items-center justify-center w-full h-screen">
            {brackets.map(([rootGame, bracketTitle]) => (
                <div className="flex flex-col justify-center w-max mx-2" key={bracketTitle}>
                    <TournamentGameWrapper
                        game={rootGame}
                        tournamentState={props.tournamentState}
                        spaceRef={props.spaceRef}
                        winnerStart={props.winnerStart}
                        loserStart={props.loserStart}
                    />
                    {bracketTitle && (
                        <div className="text-white pt-2 text-center border-t border-white">{bracketTitle}</div>
                    )}
                </div>
            ))}
        </div>
    )
}

interface TournamentGameWrapperProps {
    game: TournamentGame
    tournamentState: TournamentState
    spaceRef: Space
    winnerStart: number
    loserStart: number
}

const TournamentGameWrapper: React.FC<TournamentGameWrapperProps> = (props) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const childWrapper1Ref = useRef<HTMLDivElement>(null)
    const childWrapper2Ref = useRef<HTMLDivElement>(null)

    const [lines, setLines] = useState<{ left: number | undefined; right: number | undefined; down: number }>({
        left: undefined,
        right: undefined,
        down: 0
    })

    useEffect(() => {
        setTimeout(() => {
            if (!wrapperRef.current) return

            const wrapperRect = wrapperRef.current.getBoundingClientRect()
            const scale = props.spaceRef.viewPort?.zoomFactor ?? 1
            const startX = wrapperRect.x + wrapperRect.width / 2
            const startY = wrapperRect.y + wrapperRect.height - 17.45

            let left = undefined
            let right = undefined
            let down = 0

            if (childWrapper1Ref.current) {
                const childWrapper1Rect = childWrapper1Ref.current.getBoundingClientRect()
                const child1X = childWrapper1Rect.x + childWrapper1Rect.width / 2
                const child1Y = childWrapper1Rect.y + 17.45

                left = Math.abs(child1X - startX) / scale
                down = Math.abs(child1Y - startY)
            }

            if (childWrapper2Ref.current) {
                const childWrapper2Rect = childWrapper2Ref.current.getBoundingClientRect()
                const child2X = childWrapper2Rect.x + childWrapper2Rect.width / 2
                const child2Y = childWrapper2Rect.y + 17.45

                right = Math.abs(child2X - startX) / scale
                down = Math.abs(Math.max(down, child2Y - startY))
            }

            setLines({ left, right, down })
        }, 2)
    }, [wrapperRef.current, childWrapper1Ref.current, childWrapper2Ref.current, props.tournamentState])

    const [dependA, dependB] = props.game.dependsOn
    let round = Math.abs(props.game.round)
    let minRound = props.tournamentState.minRoundWinners
    let maxRound = props.tournamentState.maxRoundWinners
    let startRound = props.winnerStart
    if (Math.sign(props.game.round) < 0) {
        minRound = props.tournamentState.minRoundLosers
        maxRound = props.tournamentState.maxRoundLosers
        startRound = props.loserStart
    }
    if (round < minRound || round < startRound) {
        props.game.viewed = true
    }

    return (
        <div className="flex flex-col" key={props.game.id}>
            <div
                className="flex flex-col flex-grow basis-0 " /*ref={round === 1 && index === 0 ? leafRef : undefined}*/
            >
                {round >= minRound && round <= maxRound && (
                    <div className="mx-auto relative" ref={wrapperRef}>
                        <TournamentGameElement game={props.game} />
                        {round > minRound && <GameChildrenLines lines={lines} />}
                    </div>
                )}
            </div>
            <div className="flex flex-row">
                {dependA && Math.sign(dependA.round) == Math.sign(props.game.round) && (
                    <div className="mx-auto" ref={childWrapper1Ref}>
                        <TournamentGameWrapper
                            game={dependA}
                            tournamentState={props.tournamentState}
                            spaceRef={props.spaceRef}
                            winnerStart={props.winnerStart}
                            loserStart={props.loserStart}
                        />
                    </div>
                )}
                {dependB && Math.sign(dependB.round) == Math.sign(props.game.round) && (
                    <div className="mx-auto" ref={childWrapper2Ref}>
                        <TournamentGameWrapper
                            game={dependB}
                            tournamentState={props.tournamentState}
                            spaceRef={props.spaceRef}
                            winnerStart={props.winnerStart}
                            loserStart={props.loserStart}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

const GameChildrenLines: React.FC<{ lines: { left: number | undefined; right: number | undefined; down: number } }> = ({
    lines
}) => {
    if (lines.down === 0) return null

    const lineWidthValue = 2
    const lineWidth = `${lineWidthValue}px`
    const lineColor = 'white'

    const getSideLines = () => (
        <>
            <div style={{ background: lineColor, width: '100%', minHeight: lineWidth }} />
            <div
                style={{
                    background: lineColor,
                    minWidth: lineWidth,
                    height: '50%',
                    marginTop: `${lines.down / 2 - lineWidthValue}px`
                }}
            />
        </>
    )

    const commonClasses = 'absolute z-[-1] flex items-center'
    return (
        <>
            {/* Top line */}
            <div
                className={commonClasses}
                style={{
                    left: `calc(50% - ${lineWidthValue / 2}px)`,
                    background: lineColor,
                    width: lineWidth,
                    height: `${lines.down / 2}px`,
                    marginTop: `-${lines.down / 2}px`
                }}
            />
            {/* Left connection */}
            {lines.left !== undefined && (
                <div
                    className={commonClasses}
                    style={{
                        flexDirection: 'row-reverse',
                        left: `calc(50% - ${lines.left}px + ${lineWidthValue / 2}px)`,
                        top: `calc(100% - ${lines.down * 0.5}px)`,
                        width: `${lines.left}px`,
                        height: lines.down
                    }}
                >
                    {getSideLines()}
                </div>
            )}
            {/* Right connection */}
            {lines.right !== undefined && (
                <div
                    className={commonClasses}
                    style={{
                        left: `calc(50% - ${lineWidthValue / 2}px)`,
                        top: `calc(100% - ${lines.down * 0.5}px)`,
                        width: `${lines.right}px`,
                        height: lines.down
                    }}
                >
                    {getSideLines()}
                </div>
            )}
        </>
    )
}
