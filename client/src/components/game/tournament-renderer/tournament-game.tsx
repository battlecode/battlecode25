import React from 'react'
import { useAppContext } from '../../../app-context'
import { TournamentGame } from '../../../playback/Tournament'
import Game from '../../../playback/Game'
import { PageType, usePage } from '../../../app-search-params'
import { Pressable } from 'react-zoomable-ui'
import { Crown } from '../../../icons/crown'
import Tooltip from '../../tooltip'
import gameRunner from '../../../playback/GameRunner'

interface Props {
    game: TournamentGame
    lines?: { dx: number; dy: number }
}

export const TournamentGameElement: React.FC<Props> = ({ lines, game }) => {
    const [loadingGame, setLoadingGame] = React.useState(false)
    const [page, setPage] = usePage()
    const appContext = useAppContext()

    const playable = !game.dependsOn || game.dependsOn.every((g) => !g || g.viewed)

    const onClick = () => {
        if (loadingGame || !playable) return

        setLoadingGame(true)
        fetch(game.gameFile).then((response) => {
            response.arrayBuffer().then((buffer) => {
                if (buffer.byteLength === 0) {
                    alert('Error: Game file is empty.')
                    setLoadingGame(false)
                    return
                }
                const loadedGame = Game.loadFullGameRaw(buffer)

                gameRunner.setMatch(loadedGame.matches[0])

                appContext.setState((prevState) => ({
                    ...prevState,
                    queue: prevState.queue.concat([loadedGame])
                }))
                game.viewed = true
                setPage(PageType.GAME)
                setLoadingGame(false)
            })
        })
    }

    return (
        <Pressable
            className={
                'pt-4 px-2 pb-2 mx-2 my-4 rounded d-flex flex-col relative border-2 border-white min-w-[80px] max-w-[140px] ' +
                (loadingGame ? 'opacity-50' : '') +
                ' ' +
                (game.gameFile
                    ? playable
                        ? 'bg-blueLight hover:bg-blueLighter cursor-pointer'
                        : 'bg-blueDark'
                    : 'bg-greyLight')
            }
            onTap={onClick}
        >
            <GameNumber number={game.id} />
            {game.gameFile && (
                <>
                    <GameTeam game={game} teamIdx={0} />
                    <div className="ml-0.5 text-xxxs">vs</div>
                    <GameTeam game={game} teamIdx={1} />
                </>
            )}
        </Pressable>
    )
}

const GameTeam: React.FC<{ game: TournamentGame; teamIdx: number }> = ({ game, teamIdx }) => {
    const dependsOn = game.dependsOn[teamIdx]
    const otherDependsOn = game.dependsOn[1 - teamIdx]
    if (dependsOn && dependsOn.teams[dependsOn.winnerIndex] !== game.teams[teamIdx])
        throw new Error(
            `dependsOn winner does not match game teams at game ${game.id}, ${
                dependsOn.teams[dependsOn.winnerIndex]
            } !== ${game.teams[teamIdx]}`
        )

    const gameBelowViewed =
        (!dependsOn && (!otherDependsOn || otherDependsOn.viewed)) || (dependsOn && dependsOn.viewed)
    const shownTeamName = game.viewed || gameBelowViewed ? game.teams[teamIdx] : '???'
    const teamWon = game.viewed && game.winnerIndex == teamIdx
    const teamLost = game.viewed && game.winnerIndex != teamIdx

    const nameClass = (shownTeamName.length > 150 ? 'text-xxxs' : 'text-xxs') + (teamWon ? ' font-bold' : '')

    return (
        <div className="w-full">
            <Tooltip
                text={shownTeamName}
                wrapperClass={'w-full'}
                bg={'bg-white'}
                color={'text-black-800'}
                size={'text-xxs'}
                delay={400}
            >
                <div className={'whitespace-nowrap overflow-hidden w-full flex flex-row items-center'}>
                    <span
                        className={
                            nameClass + ' min-w-0 text-ellipsis overflow-hidden ' + (teamLost ? 'line-through' : '')
                        }
                    >
                        {shownTeamName}
                    </span>
                    {teamWon && (
                        <span className="text-xxs pb-[2.5px] ml-1">
                            <Crown />
                        </span>
                    )}
                </div>
            </Tooltip>
        </div>
    )
}

const GameNumber: React.FC<{ number: number }> = ({ number }) => {
    return (
        <div className="absolute top-[-1px] left-[-1px] bg-white rounded-tl-sm rounded-br px-0.5 h-[12px] text-xxs flex items-center justify-center">
            {number}
        </div>
    )
}
