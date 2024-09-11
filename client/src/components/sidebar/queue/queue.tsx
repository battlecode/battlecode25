import React from 'react'
import { useAppContext } from '../../../app-context'
import { useKeyboard } from '../../../util/keyboard'
import { BATTLECODE_YEAR } from '../../../constants'
import { Button } from '../../button'
import { FiUpload } from 'react-icons/fi'
import Game from '../../../playback/Game'
import { QueuedGame } from './queue-game'
import gameRunner from '../../../playback/GameRunner'

interface Props {
    open: boolean
}

export const QueuePage: React.FC<Props> = (props) => {
    const context = useAppContext()
    const inputRef = React.useRef<HTMLInputElement | null>()
    const queue = context.state.queue

    const keyboard = useKeyboard()

    const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length == 0) return
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = () => {
            const game = Game.loadFullGameRaw(reader.result as ArrayBuffer)

            // select the first match
            const selectedMatch = game.matches[0]
            game.currentMatch = selectedMatch

            context.setState((prevState) => ({
                ...prevState,
                queue: queue.concat([game])
            }))
            gameRunner.selectMatch(selectedMatch)
        }
        reader.readAsArrayBuffer(file)
    }

    React.useEffect(() => {
        if (context.state.disableHotkeys) return

        if (keyboard.keyCode == 'KeyO' && (keyboard.ctrlKey || keyboard.metaKey)) {
            inputRef.current?.click()
        }
    }, [keyboard])

    if (!props.open) return null

    return (
        <div className="flex flex-col">
            <input
                type="file"
                hidden
                ref={(ref) => (inputRef.current = ref)}
                onChange={upload}
                accept={'.bc' + (BATTLECODE_YEAR % 100) + ',.bc*'}
            />
            <Button onClick={() => inputRef.current?.click()}>
                <FiUpload className="align-middle text-base mr-2" />
                Upload a .bc{BATTLECODE_YEAR % 100} replay file
            </Button>
            <p className="mt-2 mb-2">
                Games ({queue.length === 0 ? 0 : 1}/{queue.length})
            </p>
            {queue.map((game) => (
                <QueuedGame key={game.id} game={game} />
            ))}
        </div>
    )
}
