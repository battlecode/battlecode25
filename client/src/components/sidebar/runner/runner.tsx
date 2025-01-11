import React, { useEffect, useRef, useState } from 'react'
import { LanguageVersion, SupportedLanguage, useScaffold } from './scaffold'
import { Button, SmallButton } from '../../button'
import { nativeAPI } from './native-api-wrapper'
import { Select } from '../../forms'
import { InputDialog } from '../../input-dialog'
import Tooltip from '../../tooltip'
import { SectionHeader } from '../../section-header'
import { FixedSizeList, ListOnScrollProps } from 'react-window'
import { OpenExternal } from '../../../icons/open-external'
import { BasicDialog } from '../../basic-dialog'
import { RingBuffer } from '../../../util/ring-buffer'
import { ProfilerDialog } from './profiler'
import { GameRenderer } from '../../../playback/GameRenderer'
import GameRunner from '../../../playback/GameRunner'
import { Resizable } from 're-resizable'

type RunnerPageProps = {
    open: boolean
    scaffold: ReturnType<typeof useScaffold>
}

export const RunnerPage: React.FC<RunnerPageProps> = ({ open, scaffold }) => {
    const [
        setup,
        error,
        availableMaps,
        availablePlayers,
        language,
        langVersions,
        changeLanguage,
        manuallySetupScaffold,
        reloadData,
        scaffoldLoading,
        runMatch,
        killMatch,
        consoleLines
    ] = scaffold

    const getStoredInstalls = () => {
        const installs = JSON.parse(localStorage.getItem(`customInstalls${language}`) ?? '[]') as string[]
        return installs.map((path) => ({
            display: path,
            path
        }))
    }

    const getDefaultInstall = () => {
        const install = localStorage.getItem(`defaultInstall${language}`) ?? ''

        // If the language supports an 'auto' version, set this if nothing has been set
        const autoVer = langVersions.find((v) => v.display == 'Auto')
        if (!install && autoVer) return autoVer

        const storedInstalls = getStoredInstalls()
        return [...langVersions, ...storedInstalls].find((i) => i.path == install && i.display !== 'Auto')
    }

    const [customVersions, setCustomVersions] = useState<LanguageVersion[]>(getStoredInstalls())
    const [langVersion, setLangVersion] = useState<LanguageVersion | undefined>(getDefaultInstall())
    const [teamA, setTeamA] = useState<string | undefined>(undefined)
    const [teamB, setTeamB] = useState<string | undefined>(undefined)
    const [maps, setMaps] = useState<Set<string>>(new Set())

    const runGame = () => {
        if (!teamA || !teamB || maps.size === 0 || !langVersion || !runMatch) return
        runMatch(langVersion, teamA, teamB, maps)
    }

    const resetSettings = () => {
        setMaps(new Set())
        setTeamA(undefined)
        setTeamB(undefined)
    }

    useEffect(() => {
        const teamA = availablePlayers.size > 0 ? [...availablePlayers][0] : undefined
        const teamB = availablePlayers.size > 1 ? [...availablePlayers][1] : teamA
        setTeamA(teamA)
        setTeamB(teamB)
    }, [availablePlayers])

    useEffect(() => {
        setLangVersion(getDefaultInstall())
    }, [langVersions])

    useEffect(() => {
        setCustomVersions(getStoredInstalls())
        setLangVersion(getDefaultInstall())
        reloadData()
    }, [language])

    const MemoConsole = React.useMemo(() => <Console lines={consoleLines} />, [consoleLines.effectiveLength()])

    if (open && !nativeAPI) return <>Run the client locally to use the runner</>

    /* Keep the component mounted but hidden when !open so we retain any locally resized/edited elements */

    const lastLogLine = consoleLines.get(consoleLines.length() - 1)
    const runDisabled = !teamA || !teamB || maps.size === 0 || !langVersion
    return (
        <div
            className={
                'flex flex-col grow' +
                (scaffoldLoading ? ' opacity-50 pointer-events-none' : '') +
                (open ? '' : ' hidden')
            }
        >
            {!setup ? (
                <>
                    {error && <div className="text-red">{`Setup Error: ${error}`}</div>}
                    <Button onClick={manuallySetupScaffold}>Setup Scaffold</Button>
                </>
            ) : (
                <>
                    <LanguageSelector language={language} onChange={changeLanguage} />
                    <LanguageVersionSelector
                        language={language}
                        version={langVersion}
                        allVersions={[...langVersions, ...customVersions]}
                        onSelect={(j) => {
                            setLangVersion(j)
                            localStorage.setItem(`defaultInstall${language}`, j && j.display !== 'Auto' ? j.path : '')
                        }}
                        onAddCustom={(c) => {
                            const newVersions = [...customVersions, c]
                            setCustomVersions(newVersions)
                            localStorage.setItem(
                                `customInstalls${language}`,
                                JSON.stringify(newVersions.map((i) => i.path))
                            )
                        }}
                    />
                    <TeamSelector
                        teamA={teamA}
                        teamB={teamB}
                        options={availablePlayers}
                        onChangeA={(t) => setTeamA(t)}
                        onChangeB={(t) => setTeamB(t)}
                    />
                    <MapSelector
                        maps={maps}
                        availableMaps={availableMaps}
                        onSelect={(m) => setMaps(new Set([...maps, m]))}
                        onDeselect={(m) => setMaps(new Set([...maps].filter((x) => x !== m)))}
                    />
                    <SmallButton
                        className="mt-2"
                        onClick={() => {
                            resetSettings()
                            reloadData()
                        }}
                    >
                        Reload maps and players
                    </SmallButton>
                    <SmallButton
                        className="mt-[-5px]"
                        onClick={() => {
                            resetSettings()
                            manuallySetupScaffold()
                        }}
                    >
                        Change scaffold directory
                    </SmallButton>

                    <div className="flex flex-row mx-auto mt-0 gap-2">
                        {!killMatch ? (
                            <div className="w-fit">
                                <Tooltip
                                    location="right"
                                    text={runDisabled ? 'Please select both teams and a map' : 'Run the game'}
                                >
                                    <Button onClick={runGame} disabled={runDisabled}>
                                        Run
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : (
                            <Button onClick={killMatch}>Stop</Button>
                        )}

                        <div className="w-fit">{MemoConsole}</div>

                        <ProfilerDialog />
                    </div>

                    {(killMatch || lastLogLine) && (
                        <span className="text-center opacity-60 text-xxs mt-2 whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                            {lastLogLine?.content ?? 'Waiting...'}
                        </span>
                    )}
                </>
            )}
        </div>
    )
}

interface LanguageSelectorProps {
    language: SupportedLanguage
    onChange: (language: SupportedLanguage) => void
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onChange }) => {
    return (
        <div>
            <div className="flex flex-col flex-grow">
                <label>Language</label>
                <Select className="w-full" value={language} onChange={(e) => onChange(e as SupportedLanguage)}>
                    {Object.getOwnPropertyNames(SupportedLanguage).map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    )
}

interface LanguageVersionSelectorProps {
    language: SupportedLanguage
    version: LanguageVersion | undefined
    allVersions: LanguageVersion[]
    onSelect: (version: LanguageVersion | undefined) => void
    onAddCustom: (version: LanguageVersion) => void
}

const LanguageVersionSelector: React.FC<LanguageVersionSelectorProps> = (props) => {
    const [selectPath, setSelectPath] = React.useState(false)

    const closeDialog = (path: string) => {
        if (path) {
            const newJava = { display: path, path }
            props.onAddCustom(newJava)
            props.onSelect(newJava)
        }
        setSelectPath(false)
    }

    return (
        <>
            <div className="flex flex-col mt-3">
                <label>{`${props.language} Version`}</label>
                <Select
                    className="w-full"
                    value={props.version ? JSON.stringify(props.version) : ''}
                    onChange={(e) => {
                        if (e == '') {
                            props.onSelect(undefined)
                        } else if (e == 'CUSTOM') {
                            setSelectPath(true)
                        } else {
                            const parsed = JSON.parse(e)
                            const found = props.allVersions.find(
                                (j) => j.path == parsed.path && j.display == parsed.display
                            )!
                            props.onSelect(found)
                        }
                    }}
                >
                    {props.version === undefined && <option value={''}>Select a version</option>}
                    <option value={'CUSTOM'}>Custom</option>
                    {props.allVersions.map((t) => (
                        <option key={JSON.stringify(t)} value={JSON.stringify(t)}>
                            {t.display}
                        </option>
                    ))}
                </Select>
            </div>
            <InputDialog
                open={selectPath}
                onClose={closeDialog}
                title={`Custom ${props.language} Path`}
                description={`Enter the path to the ${props.language} installation`}
                placeholder="Path..."
            />
        </>
    )
}

interface TeamSelectorProps {
    teamA: string | undefined
    teamB: string | undefined
    options: Set<string>
    onChangeA: (team: string | undefined) => void
    onChangeB: (team: string | undefined) => void
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ teamA, teamB, options, onChangeA, onChangeB }) => {
    return (
        <div className="flex flex-row mt-3">
            <div className="flex flex-col flex-grow">
                <label>Team A</label>
                <Select className="w-full" value={teamA ?? 'NONE'} onChange={(e) => onChangeA(e)}>
                    {teamA === undefined && <option value={'NONE'}>Select a team</option>}
                    {[...options].sort().map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="flex flex-col justify-center">
                <div
                    onClick={() => {
                        const tmp = teamB
                        onChangeB(teamA)
                        onChangeA(tmp)
                    }}
                    className="mx-2 whitespace-nowrap cursor-pointer mt-auto mb-2 text-xs font-bold"
                >
                    {'<->'}
                </div>
            </div>
            <div className="flex flex-col flex-grow">
                <label className="ml-auto">Team B</label>
                <Select className="w-full" value={teamB ?? 'NONE'} onChange={(e) => onChangeB(e)}>
                    {teamB === undefined && <option value={'NONE'}>Select a team</option>}
                    {[...options].sort().map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    )
}

interface MapSelectorProps {
    maps: Set<string>
    availableMaps: Set<string>
    onSelect: (map: string) => void
    onDeselect: (map: string) => void
}

const MapSelector: React.FC<MapSelectorProps> = ({ maps, availableMaps, onSelect, onDeselect }) => {
    return (
        <div className="flex flex-col mt-3">
            <label>Maps</label>
            <Resizable
                minWidth="100%"
                maxWidth="100%"
                minHeight={50}
                defaultSize={{
                    width: '100%',
                    height: 120
                }}
            >
                <div className="flex flex-col border border-white py-1 px-1 h-full rounded-md overflow-y-auto">
                    {[...availableMaps].sort().map((m) => {
                        const selected = maps.has(m)
                        return (
                            <div
                                key={m}
                                className={'cursor-pointer hover:bg-lightHighlight flex items-center justify-between'}
                                onClick={() => (maps.has(m) ? onDeselect(m) : onSelect(m))}
                            >
                                {m}
                                <input
                                    type={'checkbox'}
                                    readOnly
                                    checked={selected}
                                    className="pointer-events-none mr-2"
                                />
                            </div>
                        )
                    })}
                </div>
            </Resizable>
        </div>
    )
}

export type ConsoleLine = { content: string; type: 'output' | 'error' | 'bold' }

type Props = {
    lines: RingBuffer<ConsoleLine>
}

export const Console: React.FC<Props> = ({ lines }) => {
    const consoleRef = useRef<HTMLDivElement>(null)

    const [tail, setTail] = useState(true)
    const [popout, setPopout] = useState(false)

    const getLineClass = (line: ConsoleLine) => {
        switch (line.type) {
            case 'output':
                return ''
            case 'error':
                return 'text-[#ff0000]'
            case 'bold':
                return 'font-bold'
        }
    }

    const focusRobot = (round: number, id: number) => {
        setPopout(false)
        GameRunner.jumpToRound(round)
        GameRenderer.setSelectedRobot(id)

        // If turn playback is enabled, focus the robot's exact turn as well
        if (GameRunner.match?.playbackPerTurn) {
            GameRunner.jumpToRobotTurn(id)
        }
    }

    const ConsoleRow = (props: { index: number; style: any }) => {
        const content = lines.get(props.index)!.content

        // Check if the printout is from a bot. If so, add a special click element
        // that selects the bot
        const regexp = /\[([A-Z]): #([0-9]+)@([0-9]+)] (.*)/
        const found = content.match(regexp)
        if (found && found.length == 5) {
            const team = found[1]
            const id = Number(found[2])
            const round = Number(found[3])
            const ogText = found[4].replace(/\n/g, ' ')

            return (
                <div className="flex items-center gap-1 sele" style={props.style}>
                    <span
                        className="text-blueLight decoration-blueLight text-xs whitespace-nowrap underline cursor-pointer"
                        onClick={() => focusRobot(round, id)}
                    >
                        {`[Team ${team}, ID #${id}, Round ${round}]`}
                    </span>
                    <span className={getLineClass(lines.get(props.index)!) + ' text-xs whitespace-pre'}>{ogText}</span>
                </div>
            )
        }

        return (
            <span style={props.style} className={getLineClass(lines.get(props.index)!) + ' text-xs whitespace-nowrap'}>
                {content}
            </span>
        )
    }

    const handleScroll = (e: ListOnScrollProps) => {
        if (!consoleRef.current) return
        const div = consoleRef.current
        const isScrolledToBottom = div.scrollTop + div.offsetHeight - div.scrollHeight >= -10
        setTail(isScrolledToBottom)
    }

    const updatePopout = (pop: boolean) => {
        setPopout(pop)
        setTimeout(() => scrollToBottom(), 50)
    }

    const scrollToBottom = () => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
            setTail(true)
        }
    }

    useEffect(() => {
        if (lines.effectiveLength() == 0) setTail(true)
        if (tail && consoleRef.current) {
            scrollToBottom()
        }
    }, [lines.effectiveLength()])

    const lineList = (
        <FixedSizeList
            outerRef={consoleRef}
            height={2000}
            itemCount={lines.length()}
            itemSize={20}
            layout="vertical"
            width={'100%'}
            onScroll={handleScroll}
            overscanCount={10}
        >
            {ConsoleRow}
        </FixedSizeList>
    )
    return (
        <>
            <Tooltip location="bottom" text={'View output from running the game'}>
                <Button onClick={() => updatePopout(true)}>Console</Button>
            </Tooltip>
            <BasicDialog open={popout} onCancel={() => updatePopout(false)} title="Console" width="lg">
                <div className="flex flex-col grow h-full w-full">
                    <div
                        className="flex-grow border border-white py-1 px-1 rounded-md overflow-auto flex flex-col min-h-[250px] w-full"
                        style={{ height: '80vh', maxHeight: '80vh' }}
                    >
                        {popout && lineList}
                    </div>
                </div>
            </BasicDialog>
        </>
    )
}
