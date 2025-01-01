import React, { useEffect, useRef, useState } from 'react'
import { useMatch } from '../../../playback/GameRunner'
import Tooltip from '../../tooltip'
import { Button } from '../../button'
import { BasicDialog } from '../../basic-dialog'
import { ParsedProfilerFile } from '../../../playback/Profiler'
import { Select } from '../../forms'
import { GameRenderer } from '../../../playback/GameRenderer'

export const ProfilerDialog: React.FC = () => {
    const match = useMatch()
    const { selectedBodyID } = GameRenderer.useCanvasClickEvents()

    const [open, setOpen] = useState(false)
    const [teamIndex, setTeamIndex] = React.useState<number | undefined>()
    const [robotIndex, setRobotIndex] = React.useState<number | undefined>()

    const handleTeamIndexChange = (val: string) => {
        const newTeamIndex = Number(val)
        setTeamIndex(newTeamIndex)
        setRobotIndex(undefined)
    }

    const handleRobotIndexChange = (val: string) => {
        setRobotIndex(Number(val))
    }

    const profiles = (match && match.profilerFiles[teamIndex ?? 0]?.profiles) || []

    // Auto focus profiler on the currently selected robot
    React.useEffect(() => {
        if (!match) return
        if (selectedBodyID === undefined) return
        if (!match.currentRound.bodies.hasId(selectedBodyID)) return

        const body = match.currentRound.bodies.getById(selectedBodyID)
        const index = match.profilerFiles[body.team.id - 1].profiles.findIndex((p) => p.id === body.id)

        if (index === -1) return

        setTeamIndex(body.team.id - 1)
        setRobotIndex(index)
    }, [open])

    React.useEffect(() => {
        setTeamIndex(undefined)
        setRobotIndex(undefined)
    }, [match])

    React.useEffect(() => {
        // Update default theme
        localStorage.setItem('speedscope-color-scheme', 'DARK')
    }, [])

    return (
        <>
            <Tooltip location="left" text={'View profiling data for the current game'}>
                <Button onClick={() => setOpen(true)}>Profiler</Button>
            </Tooltip>
            <BasicDialog open={open} onCancel={() => setOpen(false)} title="Profiler" width="lg" keepMounted>
                <div className="h-[80vh] max-h-[80vh] overflow-hidden">
                    {match ? (
                        profiles.length == 0 ? (
                            <div>No profiling data found. Make sure you run with profiling enabled in config.</div>
                        ) : (
                            <>
                                <div className="flex gap-2 items-center">
                                    Team Index:
                                    <Select
                                        value={teamIndex ?? ''}
                                        onChange={handleTeamIndexChange}
                                        style={{ width: '300px' }}
                                    >
                                        {teamIndex === undefined && <option value="">Select a value...</option>}
                                        {match.profilerFiles.map((_, index) => (
                                            <option key={index} value={index}>
                                                {index}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex gap-2 items-center mt-2 mb-2">
                                    Robot ID:
                                    <Select
                                        value={robotIndex ?? ''}
                                        onChange={handleRobotIndexChange}
                                        disabled={teamIndex === undefined}
                                        style={{ width: '300px' }}
                                    >
                                        {robotIndex === undefined && <option value="">Select a value...</option>}
                                        {profiles.map((profile, index) => (
                                            <option key={index} value={index}>
                                                {profile.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                {teamIndex !== undefined && robotIndex !== undefined && (
                                    <ProfilerIFrame
                                        currentTeamIndex={teamIndex}
                                        currentRobotIndex={robotIndex}
                                        profilerFiles={match.profilerFiles}
                                    />
                                )}
                            </>
                        )
                    ) : (
                        <div>No match loaded</div>
                    )}
                </div>
            </BasicDialog>
        </>
    )
}

interface IFrameProps {
    currentTeamIndex: number
    currentRobotIndex: number
    profilerFiles: ParsedProfilerFile[]
}

const ProfilerIFrame: React.FC<IFrameProps> = ({ currentTeamIndex, currentRobotIndex, profilerFiles }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const sendToIFrame = (type: string, payload: any) => {
        const frame = iframeRef.current?.contentWindow
        if (frame) frame.postMessage({ type, payload }, '*')
    }

    const updateIframeRobot = () => {
        if (currentRobotIndex < 0 || currentTeamIndex < 0) return

        const file = profilerFiles[currentTeamIndex]
        if (!file) return

        const data = {
            $schema: 'https://www.speedscope.app/file-format-schema.json',
            shared: {
                frames: file.frames
            },
            profiles: [file.profiles[currentRobotIndex]]
        }

        sendToIFrame('load', data)

        //download this as json
        // const dataStr = JSON.stringify(data)
        // const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        // const exportFileDefaultName = 'data.json'
        // const linkElement = document.createElement('a')
        // linkElement.setAttribute('href', dataUri)
        // linkElement.setAttribute('download', exportFileDefaultName)
        // linkElement.click()
    }

    useEffect(() => {
        const frame = iframeRef.current
        if (!frame) return

        const onLoadHandler = () => {
            sendToIFrame(
                'apply-css',
                ` body > div > div:nth-child(2) > div:last-child > div:not(:last-child),
                  body > div > div:nth-child(3) > div > div > p:nth-child(2),
                  body > div > div:nth-child(3) > div > div > p:last-child,
                  #file,
                  label[for="file"] {
                      display: none !important;
                  }`
            )
            updateIframeRobot()
        }

        frame.onload = onLoadHandler
        return () => {
            if (frame) frame.onload = null
        }
    }, [])

    useEffect(() => {
        updateIframeRobot()
    }, [currentTeamIndex, currentRobotIndex, profilerFiles])

    return (
        <iframe
            ref={iframeRef}
            src="speedscope/index.html#localProfilePath=../static/profiler.js"
            style={{ width: '100%', height: '100%' }}
        />
    )
}
