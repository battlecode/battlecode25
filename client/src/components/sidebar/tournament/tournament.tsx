import React from 'react'
import { useAppContext } from '../../../app-context'
import { Button } from '../../button'
import { FiEye, FiEyeOff, FiUpload } from 'react-icons/fi'
import Tournament, { JsonTournamentGame } from '../../../playback/Tournament'
import { NumInput } from '../../forms'
import { BsLock, BsUnlock } from 'react-icons/bs'
import { useSearchParamBool, useSearchParamNumber } from '../../../app-search-params'

interface TournamentPageProps {
    open: boolean
}

export const TournamentPage: React.FC<TournamentPageProps> = ({ open }) => {
    const context = useAppContext()
    const inputRef = React.useRef<HTMLInputElement | null>()

    const [tournamentWinnerMin] = useSearchParamNumber('tournamentWinnerMin', 0)
    const [tournamentWinnerMax] = useSearchParamNumber('tournamentWinnerMax', 0)
    const [tournamentLoserMin] = useSearchParamNumber('tournamentLoserMin', 0)
    const [tournamentLoserMax] = useSearchParamNumber('tournamentLoserMax', 0)
    const [tournamentShowLosers] = useSearchParamBool('tournamentShowLosers', false)

    const [locked, setLocked] = React.useState(false)

    const tournament = context.state.tournament

    const updateMinRoundLosers = (val: number) => {
        if (locked) return
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: { ...prevState.tournamentState, minRoundLosers: val }
        }))
    }

    const updateMaxRoundLosers = (val: number) => {
        if (locked) return
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: { ...prevState.tournamentState, maxRoundLosers: val }
        }))
    }

    const updateMinRoundWinners = (val: number) => {
        if (locked) return
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: { ...prevState.tournamentState, minRoundWinners: val }
        }))
    }

    const updateMaxRoundWinners = (val: number) => {
        if (locked) return
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: { ...prevState.tournamentState, maxRoundWinners: val }
        }))
    }

    const toggleShowLosers = () => {
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: { ...prevState.tournamentState, showLosers: !prevState.tournamentState.showLosers }
        }))
    }

    const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length == 0) return
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = () => {
            context.setState((prevState) => ({
                ...prevState,
                tournament: new Tournament(JSON.parse(reader.result as string).results as JsonTournamentGame[])
            }))
        }
        reader.readAsText(file)
    }

    React.useEffect(() => {
        if (!tournament) return

        // Reset state if it was not overridden
        console.log(tournamentShowLosers)
        context.setState((prevState) => ({
            ...prevState,
            tournamentState: {
                minRoundWinners: tournamentWinnerMin == 0 ? 1 : tournamentWinnerMin,
                maxRoundWinners: tournamentWinnerMax == 0 ? tournament.maxRound : tournamentWinnerMax,
                minRoundLosers: tournamentLoserMin == 0 ? 1 : tournamentLoserMin,
                maxRoundLosers: tournamentLoserMax == 0 ? Math.abs(tournament.minRound) : tournamentLoserMax,
                showLosers: tournamentShowLosers
            }
        }))
    }, [tournament])

    if (!open) return null

    return (
        <div className={'flex flex-col'}>
            <input type="file" hidden ref={(ref) => (inputRef.current = ref)} onChange={upload} accept={'.json'} />
            <Button onClick={() => inputRef.current?.click()}>
                <FiUpload className="align-middle text-base mr-2" />
                Upload a tournament file
            </Button>
            {tournament && (
                <div className="flex flex-col gap-1 relative text-xxs mr-auto rounded-md bg-lightCard border-gray-500 border mb-4 p-3 w-full shadow-md">
                    <div className="text-xs whitespace mb-2 overflow-ellipsis overflow-hidden">
                        <span className="font-bold">{`Tournament '${tournament.name}'`}</span>
                    </div>
                    <span>
                        <b>Rounds:</b> {tournament.maxRound}
                    </span>
                    <span>
                        <b>Participants:</b> {tournament.participantCount}
                    </span>
                    <span className="flex items-center mt-[-3px]">
                        <b className="mr-2">Starting Round (Winners):</b>
                        <NumInput
                            disabled={locked}
                            value={context.state.tournamentState.minRoundWinners}
                            changeValue={updateMinRoundWinners}
                            min={1}
                            max={tournament.maxRound}
                        />
                        <button
                            className="ml-1 hover:bg-lightHighlight p-[0.2rem] rounded-md"
                            onClick={() => setLocked(!locked)}
                        >
                            {locked ? (
                                <BsLock className="w-[15px] h-[15px]" />
                            ) : (
                                <BsUnlock className="w-[15px] h-[15px]" />
                            )}
                        </button>
                    </span>
                    <span className="flex items-center mt-[-3px]">
                        <b className="mr-2">Ending Round (Winners):</b>
                        <NumInput
                            disabled={locked}
                            value={context.state.tournamentState.maxRoundWinners}
                            changeValue={updateMaxRoundWinners}
                            min={1}
                            max={tournament.maxRound}
                        />
                    </span>
                    {tournament.losersBracketRoot && (
                        <>
                            <span className="flex items-center mt-[-3px]">
                                <b className="mr-2">Starting Round (Losers):</b>
                                <NumInput
                                    disabled={locked}
                                    value={context.state.tournamentState.minRoundLosers}
                                    changeValue={updateMinRoundLosers}
                                    min={1}
                                    max={Math.abs(tournament.minRound)}
                                />
                                <button
                                    className="ml-1 hover:bg-lightHighlight p-[0.2rem] rounded-md"
                                    onClick={toggleShowLosers}
                                >
                                    {context.state.tournamentState.showLosers ? (
                                        <FiEye className="w-[15px] h-[15px]" />
                                    ) : (
                                        <FiEyeOff className="w-[15px] h-[15px]" />
                                    )}
                                </button>
                            </span>
                            <span className="flex items-center mt-[-3px]">
                                <b className="mr-2">Ending Round (Losers):</b>
                                <NumInput
                                    disabled={locked}
                                    value={context.state.tournamentState.maxRoundLosers}
                                    changeValue={updateMaxRoundLosers}
                                    min={1}
                                    max={Math.abs(tournament.minRound)}
                                />
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
