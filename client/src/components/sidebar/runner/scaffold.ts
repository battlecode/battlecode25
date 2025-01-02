import { useEffect, useRef, useState } from 'react'
import { BATTLECODE_YEAR, ENGINE_BUILTIN_MAP_NAMES } from '../../../constants'
import { NativeAPI, nativeAPI } from './native-api-wrapper'
import { ConsoleLine } from './runner'
import { useForceUpdate } from '../../../util/react-util'
import WebSocketListener from './websocket'
import { useAppContext } from '../../../app-context'
import Game from '../../../playback/Game'
import Match from '../../../playback/Match'
import { RingBuffer } from '../../../util/ring-buffer'
import GameRunner from '../../../playback/GameRunner'

export enum SupportedLanguage {
    Java = 'Java',
    Python = 'Python'
}

export type LanguageVersion = {
    display: string
    path: string
}

type Scaffold = [
    setup: boolean,
    error: string,
    availableMaps: Set<string>,
    availablePlayers: Set<string>,
    language: SupportedLanguage,
    langVersions: LanguageVersion[],
    changeLanguage: (lang: SupportedLanguage) => void,
    manuallySetupScaffold: () => Promise<void>,
    reloadData: () => void,
    scaffoldLoading: boolean,
    runMatch: (langVersion: LanguageVersion, teamA: string, teamB: string, selectedMaps: Set<string>) => Promise<void>,
    killMatch: (() => Promise<void>) | undefined,
    console: RingBuffer<ConsoleLine>
]

export const useScaffold = (): Scaffold => {
    const getDefaultLanguage = () => {
        const stored = localStorage.getItem('language')
        if (stored) return stored as SupportedLanguage
        return SupportedLanguage.Java
    }

    const appContext = useAppContext()
    const [language, setLanguage] = useState(getDefaultLanguage())
    const [langVersions, setLangVersions] = useState<LanguageVersion[]>([])
    const [availableMaps, setAvailableMaps] = useState<Set<string>>(new Set())
    const [availablePlayers, setAvailablePlayers] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState<boolean>(true)
    const [scaffoldPath, setScaffoldPath] = useState<string | undefined>(undefined)
    const [error, setError] = useState('')
    const matchPID = useRef<string | undefined>(undefined)
    const forceUpdate = useForceUpdate()
    const consoleLines = useRef<RingBuffer<ConsoleLine>>(new RingBuffer(10000))

    const [webSocketListener, setWebSocketListener] = useState<WebSocketListener | undefined>()

    const log = (line: ConsoleLine) => {
        consoleLines.current.push(line)
        forceUpdate()
    }

    const manuallySetupScaffold = async () => {
        if (!nativeAPI) return
        setLoading(true)
        const path = await nativeAPI.openScaffoldDirectory()
        if (!path) {
            setLoading(false)
            return
        }

        const validLang = await isValidScaffoldDir(path, nativeAPI)
        setLoading(false)

        if (!validLang) {
            setScaffoldPath(undefined)
            setError('Invalid scaffold path! Please select a valid one (refer to the README for more details)')
            return
        }

        setError('')
        setScaffoldPath(path)
        changeLanguage(validLang)
    }

    async function runMatch(
        langVersion: LanguageVersion,
        teamA: string,
        teamB: string,
        selectedMaps: Set<string>
    ): Promise<void> {
        if (matchPID.current || !scaffoldPath) return
        consoleLines.current.clear()
        try {
            const newPID = await dispatchMatch(
                language,
                langVersion,
                teamA,
                teamB,
                selectedMaps,
                nativeAPI!,
                scaffoldPath!,
                appContext.state.config.validateMaps,
                appContext.state.config.profileGames
            )
            matchPID.current = newPID
        } catch (e: any) {
            consoleLines.current.push({ content: e, type: 'error' })
        }
        forceUpdate()
    }

    const killMatch = async (): Promise<void> => {
        if (!matchPID.current) return
        await nativeAPI!.child_process.kill(matchPID.current)
        matchPID.current = undefined
        forceUpdate()
    }

    const changeLanguage = (lang: SupportedLanguage) => {
        localStorage.setItem('language', lang)
        setLanguage(lang)
    }

    const reloadData = () => {
        if (!nativeAPI || !scaffoldPath) return
        setLoading(true)

        let langPromise
        switch (language) {
            case SupportedLanguage.Java:
                langPromise = nativeAPI.getJavas()
                break
            case SupportedLanguage.Python:
                langPromise = nativeAPI.getPythons()
                break
        }

        const dataPromise = fetchData(scaffoldPath)
        Promise.allSettled([dataPromise, langPromise]).then((res) => {
            if (res[0].status == 'fulfilled') {
                const [players, maps] = res[0].value
                setAvailablePlayers(players)
                setAvailableMaps(maps)
            } else {
                setAvailablePlayers(new Set())
                setAvailableMaps(new Set())
            }
            if (res[1].status == 'fulfilled') {
                const data = res[1].value
                const versions: LanguageVersion[] = []
                for (let i = 0; i < data.length; i += 2) {
                    versions.push({
                        display: data[i],
                        path: data[i + 1]
                    })
                }
                setLangVersions(versions)
            }
            setLoading(false)
        })
    }

    useEffect(() => {
        if (!nativeAPI) {
            setLoading(false)
            return
        }

        findDefaultScaffoldPath(nativeAPI).then((path) => {
            setLoading(false)
            setScaffoldPath(path)
        })

        nativeAPI.child_process.onStdout(({ pid, data }) => {
            if (pid !== matchPID.current) return
            log({ content: data, type: 'output' })
        })
        nativeAPI.child_process.onStderr(({ pid, data }) => {
            if (pid !== matchPID.current) return
            log({ content: data, type: 'error' })
        })
        nativeAPI.child_process.onExit(({ pid, code, signal }) => {
            if (pid !== matchPID.current) return
            log({ content: `Exited with code ${code} | ${JSON.stringify(signal)}`, type: 'bold' })
            matchPID.current = undefined
            forceUpdate()
        })

        const onGameCreated = (game: Game) => {
            appContext.setState((prevState) => ({
                ...prevState,
                queue: prevState.queue.concat([game])
            }))
            GameRunner.setGame(game)
        }

        const onMatchCreated = (match: Match) => {
            GameRunner.setMatch(match)
        }

        const onGameComplete = (game: Game) => {
            appContext.setState((prevState) => ({
                ...prevState,
                queue: prevState.queue.find((g) => g == game) ? prevState.queue : prevState.queue.concat([game])
            }))
            if (game.matches.length > 0) GameRunner.setMatch(game.matches[0])
        }

        setWebSocketListener(
            new WebSocketListener(
                appContext.state.config.streamRunnerGames,
                onGameCreated,
                onMatchCreated,
                onGameComplete
            )
        )
    }, [])

    useEffect(() => {
        if (webSocketListener) webSocketListener.setShouldStream(appContext.state.config.streamRunnerGames)
    }, [appContext.state.config.streamRunnerGames])

    useEffect(() => {
        reloadData()
    }, [scaffoldPath])

    return [
        !!scaffoldPath && error === '',
        error,
        availableMaps,
        availablePlayers,
        language,
        langVersions,
        changeLanguage,
        manuallySetupScaffold,
        reloadData,
        loading,
        runMatch,
        matchPID.current ? killMatch : undefined,
        consoleLines.current
    ]
}

async function fetchData(scaffoldPath: string) {
    const path = nativeAPI!.path
    const fs = nativeAPI!.fs

    const mapPath = await path.join(scaffoldPath, 'maps')
    if (!(await fs.exists(mapPath))) await fs.mkdir(mapPath)

    let sourcePath = await path.join(scaffoldPath, 'src')
    if (!(await fs.exists(sourcePath))) {
        // For running in the main battlecode folder
        sourcePath = await path.join(scaffoldPath, 'example-bots', 'src', 'main')

        if (!(await fs.exists(sourcePath))) {
            throw new Error(`Can't find source path: ${sourcePath}`)
        }
    }

    const playerFiles = await fs.getFiles(sourcePath, 'true')
    const sep = await path.getSeperator()
    const players = new Set(
        await Promise.all(
            playerFiles
                .filter(
                    (file) =>
                        file.endsWith('RobotPlayer.java') ||
                        file.endsWith('RobotPlayer.kt') ||
                        file.endsWith('RobotPlayer.scala')
                )
                .map(async (file) => {
                    // Relative path will contain the folder and filename, so we can split on the separator
                    // to get the folder name. We must first normalize the path to have forward slashes in the
                    // case of windows so the relative path function works correctly
                    const p1 = sourcePath.replace(/\\/g, '/')
                    const p2 = file.replace(/\\/g, '/')
                    const relPath = (await path.relative(p1, p2)).replace(/\\/g, '/')
                    const botName = relPath.split('/')[0]
                    return botName
                })
        )
    )

    const mapExtension = '.map' + (BATTLECODE_YEAR % 100)
    const mapFiles = await fs.getFiles(mapPath)
    const maps = new Set(
        mapFiles
            .filter((file) => file.endsWith(mapExtension))
            .map((file) => file.substring(0, file.length - mapExtension.length))
            .map((file) => file.split(sep)[file.split(sep).length - 1])
            .concat(Array.from(ENGINE_BUILTIN_MAP_NAMES))
    )

    localStorage.setItem('scaffoldPath', scaffoldPath)

    return [players, maps]
}

async function isValidScaffoldDir(path: string, nativeAPI: NativeAPI): Promise<SupportedLanguage | null> {
    const languageRunners: Record<SupportedLanguage, string> = {
        [SupportedLanguage.Java]: 'gradlew',
        [SupportedLanguage.Python]: 'run.py'
    }

    // Check that one of the runners exists as means of validating scaffold folder
    for (const lang of Object.keys(languageRunners)) {
        const runner = languageRunners[lang as SupportedLanguage]
        const gradlewPath = await nativeAPI.path.join(path, runner)
        if ((await nativeAPI.fs.exists(gradlewPath)) === 'true') {
            return lang as SupportedLanguage
        }
    }

    return null
}

async function findDefaultScaffoldPath(nativeAPI: NativeAPI): Promise<string | undefined> {
    const localPath = localStorage.getItem('scaffoldPath')
    if (localPath) return localPath

    let appPath = await nativeAPI.getRootPath()

    // Scan up a few parent directories to see if we can find the scaffold folder
    for (let i = 0; i <= 6; i++) {
        if (await isValidScaffoldDir(appPath, nativeAPI)) {
            return appPath
        }

        // Set to parent dir
        appPath = await nativeAPI.path.dirname(appPath)
    }

    return undefined
}

async function dispatchMatch(
    language: SupportedLanguage,
    langVersion: LanguageVersion,
    teamA: string,
    teamB: string,
    selectedMaps: Set<string>,
    nativeAPI: NativeAPI,
    scaffoldPath: string,
    validate: boolean,
    profile: boolean
): Promise<string> {
    switch (language) {
        case SupportedLanguage.Java: {
            const options = [
                `run`,
                `-x`,
                `unpackClient`,
                `-PwaitForClient=true`,
                `-PteamA=${teamA}`,
                `-PteamB=${teamB}`,
                `-Pmaps=${[...selectedMaps].join(',')}`,
                `-PvalidateMaps=${validate}`,
                `-PenableProfiler=${profile}`
            ]

            return nativeAPI.child_process.spawn(scaffoldPath, langVersion.path, options)
        }
        case SupportedLanguage.Python: {
            throw new Error('Not implemented')
        }
    }
}
