export type NativeAPI = {
    openScaffoldDirectory: () => Promise<string | undefined>
    getRootPath: () => Promise<string>
    getJavas: () => Promise<string[]>
    getPythons: () => Promise<string[]>
    exportMap: (data: number[], name: string) => Promise<void>
    getServerVersion: (year: string) => Promise<string>
    path: {
        join: (...args: string[]) => Promise<string>
        relative: (from: string, to: string) => Promise<string>
        dirname: (dir: string) => Promise<string>
        getSeperator: () => Promise<string>
    }
    fs: {
        exists: (arg: string) => Promise<string>
        mkdir: (arg: string) => Promise<void>
        // recursive: "true" or "false"
        getFiles: (path: string, recursive?: string) => Promise<string[]>
    }
    child_process: {
        spawn: (scaffoldPath: string, lang: string, langPath: string, args: string[]) => Promise<string>
        kill: (pid: string) => Promise<void>
        onStdout: (callback: (x: { pid: string; data: string }) => void) => void
        onStderr: (callback: (x: { pid: string; data: string }) => void) => void
        onExit: (callback: (x: { pid: string; code: string; signal: string }) => void) => void
    }
}

let nativeAPI: NativeAPI | undefined = undefined

// attempt to connect to electron
// @ts-ignore
if (window.electronAPI) {
    // @ts-ignore
    nativeAPI = window.electronAPI as NativeAPI
}

// attempt to connect to tauri
// @ts-ignore
if (window.tauriAPI) {
    // @ts-ignore
    nativeAPI = window.tauriAPI as NativeAPI
}

// verify that native api is setup if available
if (nativeAPI) {
    Object.keys(nativeAPI).forEach(function (key) {
        // @ts-ignore
        if (!nativeAPI[key]) {
            throw new Error(`Native API missing property: ${key}`)
        }
    })

    console.log('Native API available and verified')
}

export { nativeAPI }
