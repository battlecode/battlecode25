import { useEffect, useRef, useState } from 'react'
import Match from '../../current-game/Match'

const SIMULATION_UPDATE_INTERVAL_MS = 17 // About 60 fps

export const useGameControl = (currentMatch: Match | undefined) => {
    const [paused, setPaused] = useState(true)
    const [targetUPS, setTargetUPS] = useState(1)
    const [liveUPS, setLiveUPS] = useState(0) // State to keep track of liveUPS

    const currentUPSBuffer = useRef<number[]>([])

    useEffect(() => {
        setPaused(true) // Pause when match changes
        currentUPSBuffer.current = [] // Clear the buffer when match changes
        setLiveUPS(0) // Reset liveUPS when match changes
    }, [currentMatch])

    useEffect(() => {
        if (!currentMatch?.isPlayable()) return

        if (paused) {
            currentMatch.roundSimulation()
            currentMatch.rerender()
            return
        }

        const msPerUpdate = 1000 / targetUPS
        const updatesPerInterval = SIMULATION_UPDATE_INTERVAL_MS / msPerUpdate
        const stepInterval = setInterval(() => {
            const prevTurn = currentMatch.currentTurn.turnNumber
            currentMatch.stepSimulation(updatesPerInterval)
            if (prevTurn !== currentMatch.currentTurn.turnNumber) {
                currentUPSBuffer.current.push(Date.now())
                while (currentUPSBuffer.current.length > 0 && currentUPSBuffer.current[0] < Date.now() - 1000) {
                    currentUPSBuffer.current.shift()
                }
                setLiveUPS(currentUPSBuffer.current.length) // Update liveUPS
            }
            if (currentMatch.currentTurn.isEnd() && targetUPS > 0) setPaused(true)
        }, SIMULATION_UPDATE_INTERVAL_MS)

        return () => {
            clearInterval(stepInterval)
        }
    }, [targetUPS, currentMatch, paused])

    return {
        paused,
        setPaused,
        targetUPS,
        setTargetUPS,
        liveUPS
    }
}

