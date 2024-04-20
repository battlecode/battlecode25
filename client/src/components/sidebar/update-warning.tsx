import React, { useEffect } from 'react'
import { BATTLECODE_YEAR, GAME_VERSION } from '../../current-game/Constants'
import { nativeAPI } from './runner/native-api-wrapper'

const UPDATE_CHECK_MINUTES = 5

export const UpdateWarning = () => {
    const [update, setUpdate] = React.useState<undefined | { latest: string }>(undefined)

    useEffect(() => {
        const fetchVersion = () => {
            if (!nativeAPI) return
            nativeAPI
                .getServerVersion(`${BATTLECODE_YEAR % 100}`)
                .then((latest) => {
                    if (latest && latest.trim() != GAME_VERSION) {
                        setUpdate({ latest })
                    }
                })
                .catch(() => {})
        }

        fetchVersion()
        const interval = setInterval(fetchVersion, 1000 * 60 * UPDATE_CHECK_MINUTES)

        return () => clearInterval(interval)
    }, [])

    if (!update) return null

    return (
        <div className="bg-yellow-200 p-2 text-center">
            <p className="text-yellow-800 text-xs">
                <b>NEW VERSION AVAILABLE!</b>
                <br />
                download with <code>gradle update</code> followed by <code>gradle build</code>, and then restart the
                client: v{update.latest}
            </p>
        </div>
    )
}
