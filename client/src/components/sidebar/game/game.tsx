import React from 'react'
import { TeamTable } from './team-table'
import { ResourceGraph } from './resource-graph'
import { SpecialtyHistogram } from './histogram'
import { useSearchParamBool } from '../../../app-search-params'
import { useAppContext } from '../../../app-context'
import { SectionHeader } from '../../section-header'
import { Crown } from '../../../icons/crown'
import { BiMedal } from 'react-icons/bi'
import Tooltip from '../../tooltip'
import Match from '../../../playback/Match'
import { Team } from '../../../playback/Game'
import { useGame, useTurn } from '../../../playback/GameRunner'

const NO_GAME_TEAM_NAME = '?????'

interface Props {
    open: boolean
}

export const GamePage: React.FC<Props> = React.memo((props) => {
    const context = useAppContext()
    const game = useGame()
    const turn = useTurn()

    const [showStats, setShowStats] = useSearchParamBool('showStats', true)

    if (!props.open) return null

    const getWinCount = (team: Team) => {
        // Only return up to the current match if tournament mode is enabled
        if (!game) return 0
        let stopCounting = false
        const isWinner = (match: Match) => {
            if (context.state.tournament && stopCounting) return 0
            if (match == game.currentMatch) {
                stopCounting = true
                // Dont include this match if we aren't at the end yet
                if (context.state.tournament && !match.currentTurn.isEnd()) return 0
            }
            return match.winner?.id === team.id ? 1 : 0
        }
        return game.matches.reduce((val, match) => val + isWinner(match), 0)
    }

    const teamBox = (teamIdx: number) => {
        const winCount = game ? getWinCount(game.teams[teamIdx]) : 0
        const isEndOfMatch = turn?.isEnd()

        let showMatchWinner = !context.state.tournament || isEndOfMatch
        showMatchWinner = showMatchWinner && !!game && game.currentMatch?.winner === game.teams[teamIdx]
        let showGameWinner = !context.state.tournament || (showMatchWinner && winCount >= 3)
        showGameWinner = showGameWinner && !!game && game.winner === game.teams[teamIdx]

        return (
            <div className={'relative w-full py-2 px-3 text-center ' + (teamIdx == 0 ? 'bg-team0' : 'bg-team1')}>
                <div>{game?.teams[teamIdx].name ?? NO_GAME_TEAM_NAME}</div>
                <div className="absolute top-2 left-3">
                    <div className="relative flex items-center w-[24px] h-[24px]">
                        {showMatchWinner && (
                            <div className="absolute">
                                <Tooltip text={'Current match winner'} location={'right'}>
                                    <BiMedal opacity={0.5} fontSize={'24px'} width={'20px'} color={'yellow'} />
                                </Tooltip>
                            </div>
                        )}
                        <div
                            className="absolute w-full text-sm pointer-events-none z-5"
                            style={{ textShadow: 'white 0px 0px 4px' }}
                        >
                            {winCount > 0 && winCount}
                        </div>
                    </div>
                </div>
                <div className="absolute top-3 right-3">
                    {showGameWinner && (
                        <Tooltip text={'Overall game winner'} location={'left'}>
                            <Crown />
                        </Tooltip>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col overflow-x-hidden">
            <div className="w-full pb-3 px-4 text-center">
                {game && game.currentMatch && (
                    <div className="border-black border rounded-md font-bold">{game.currentMatch.map.name}</div>
                )}
            </div>
            {teamBox(0)}
            <TeamTable teamIdx={0} />

            <div className="h-[15px] min-h-[15px]" />

            {teamBox(1)}
            <TeamTable teamIdx={1} />

            <SectionHeader
                title="Stats"
                open={showStats}
                onClick={() => setShowStats(!showStats)}
                containerClassName="mt-2"
                titleClassName="py-2"
            >
                {game ? (
                    <>
                        {/* Note: to keep animation smooth, we should still keep the elements rendered, but we pass showStats into
                            them so that they don't render any data (since we're likely hiding stats to prevent lag) */}
                        <SpecialtyHistogram active={showStats} />
                        <br />
                        <ResourceGraph active={showStats} property="resourceAmount" propertyDisplayName="Crumbs" />
                    </>
                ) : (
                    <div>Select a game to see stats</div>
                )}
            </SectionHeader>
        </div>
    )
})
