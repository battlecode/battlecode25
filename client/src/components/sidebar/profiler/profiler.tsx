import React, { useEffect, useRef, useState } from 'react'
import { nativeAPI } from '../runner/native-api-wrapper'
import { useScaffold } from '../runner/scaffold'
import { useMatch } from '../../../playback/GameRunner'
import { Frame, Profile } from './speedscopefilespec'

type RunnerPageProps = {
    open: boolean
}

export const ProfilerPage: React.FC<RunnerPageProps> = ({ open }) => {
    const match = useMatch()

    const [teamIndex, setTeamIndex] = React.useState(-1)
    const [robotIndex, setRobotIndex] = React.useState(-1)

    const handleTeamIndexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTeamIndex = Number(e.target.value)
        setTeamIndex(newTeamIndex)
        setRobotIndex(-1)
    }

    const handleRobotIndexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRobotIndex(Number(e.target.value))
    }

    if (!open) return null
    if (!match) return <>No match loaded</>
    if (match.profilerFiles.length < 1) return <>No profiler files</>
    const profiles = match.profilerFiles[teamIndex]?.profiles || []

    return (
        <div className="flex flex-col gap-2 flex-grow">
            <div className="flex gap-2">
                Team Index:
                <select value={teamIndex} onChange={handleTeamIndexChange}>
                    {match.profilerFiles.map((_, index) => (
                        <option key={index} value={index}>
                            {index}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                Robot Index:
                <select value={robotIndex} onChange={handleRobotIndexChange}>
                    {profiles.map((profile, index) => (
                        <option key={index} value={index}>
                            {profile.name}
                        </option>
                    ))}
                </select>
            </div>
            <ProfilerIFrame
                currentTeamIndex={teamIndex}
                currentRobotIndex={robotIndex}
                profilerFiles={match.profilerFiles}
            />
        </div>
    )
}

interface IFrameProps {
    currentTeamIndex: number
    currentRobotIndex: number
    profilerFiles: ProfilerFile[]
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
            src="speedscope/index.html#localProfilePath=../profiler.js"
            style={{ width: '100%', height: '100%' }}
        />
    )
}

export type ProfilerEvent = {
    type: string
    at: number
    frame: number
}

export type ProfilerProfile = {
    name: string
    events: Array<ProfilerEvent>
}

export type ProfilerFile = {
    frames: Frame[]
    profiles: Profile[]
}
