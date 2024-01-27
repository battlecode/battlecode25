import React from 'react'
import { useAppContext } from '../../../app-context'
import { Button } from '../../button'
import { FiUpload } from 'react-icons/fi'
import Tournament, { JsonTournamentGame } from '../../../playback/Tournament'
import { NumInput } from '../../forms'
import { BsLock, BsUnlock } from 'react-icons/bs'

interface TournamentPageProps {
    open: boolean
}

export const TournamentPage: React.FC<TournamentPageProps> = ({ open }) => {
    const context = useAppContext()
    const inputRef = React.useRef<HTMLInputElement | null>()

    const [locked, setLocked] = React.useState(false)

    const updateMinRound = (val: number) => {
        if (locked) return
        context.setState((prevState) => ({ ...prevState, tournamentMinRound: val }))
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

    if (!open) return null

    const tournament = context.state.tournament
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
                        <b className="mr-2">Starting Round:</b>
                        <NumInput
                            disabled={locked}
                            value={context.state.tournamentMinRound}
                            changeValue={updateMinRound}
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
                </div>
            )}
        </div>
    )
}
