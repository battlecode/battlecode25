const { app, BrowserWindow, screen: electronScreen, ipcMain, dialog } = require('electron')
const fetch = require('electron-fetch').default
const isDev = require('electron-is-dev')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

// Sort of annoying thing we have to do, but basically since local builds output the
// module to the build folder, we can use the generated .js to load that way. However,
// in packaged builds, we need copy the module with a generic name somewhere else (bc
// issues with universal mac builds), so we have to load it directly
const whereIsIt = isDev ? require('where-is-it/build') : require('where-is-it/where-is-it.node')

let mainWindow

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: electronScreen.getPrimaryDisplay().workArea.width,
        height: electronScreen.getPrimaryDisplay().workArea.height,
        backgroundColor: 'white',
        webPreferences: {
            devTools: isDev,
            preload: path.join(__dirname, 'electron-bridge.js')
        }
    })
    const startURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`

    mainWindow.loadURL(startURL)
    mainWindow.once('ready-to-show', () => mainWindow.show())
    mainWindow.on('closed', () => {
        mainWindow = null
    })
    mainWindow.on('new-window-for-tab', (event, url) => {
        event.preventDefault()
        mainWindow.loadURL(url)
    })
}

app.on('ready', () => {
    if (!BrowserWindow.getAllWindows().length) {
        createMainWindow()
    }

    app.on('before-quit', (event) => {
        killAllProcesses()
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
})

const getFiles = (dir, recursive) => {
    const files = []
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory() && !stat.isSymbolicLink()) {
            if (recursive) files.push(...getFiles(fullPath, recursive))
        } else {
            files.push(fullPath)
        }
    }
    return files
}

const processes = new Map()
function killAllProcesses() {
    while (processes.size > 0) {
        const pid = processes.keys().next().value
        processes.get(pid).kill()
    }
}

const WINDOWS = process.platform === 'win32'
const GRADLE_WRAPPER = WINDOWS ? 'gradlew.bat' : 'gradlew'

// TODO: since we are already importing rust for whereIsIt, we could honestly
// wrap this whole API in rust and use it directly rather than having to maintain
// this

ipcMain.handle('electronAPI', async (event, operation, ...args) => {
    try {
        switch (operation) {
            case 'openScaffoldDirectory': {
                const result = await dialog.showOpenDialog({
                    title: 'Please select your battlecode-scaffold directory.',
                    properties: ['openDirectory']
                })
                return result.canceled ? undefined : result.filePaths[0]
            }
            case 'getRootPath':
                return app.getAppPath()
            case 'getJavas': {
                const output = []
                try {
                    const jvms = whereIsIt.nodeFindJava(null, null, '1.8')

                    // Add 'auto' option
                    output.push('Auto')
                    if (jvms.length === 0) {
                        output.push('')
                    } else {
                        output.push(jvms[0].path)
                    }

                    for (const jvm of jvms) {
                        output.push(`${jvm.version} (${jvm.architecture})`)
                        output.push(jvm.path)
                    }
                } catch {}
                return output
            }
            case 'getPythons': {
                const output = []
                try {
                    const pythons = whereIsIt.nodeFindPython(null, null, null, null, null, null, null)

                    for (const py of pythons) {
                        const path = py.executablePath
                        const display = py.formattedName ?? path
                        const version = py.version ?? 'Unknown'
                        output.push(`${display} (${version})`)
                        output.push(path)
                    }
                } catch {}
                return output
            }
            case 'exportMap': {
                const result = await dialog.showSaveDialog({
                    title: 'Export map',
                    defaultPath: args[1]
                })
                if (!result.canceled) {
                    const path = result.filePath
                    fs.writeFileSync(path, new Uint8Array(args[0]))
                }
                return
            }
            case 'getServerVersion': {
                let version = ''
                try {
                    const response = await fetch(`https://api.battlecode.org/api/episode/e/bc${args[0]}/?format=json`)
                    version = (await response.json()).release_version_public
                } catch {}
                return version
            }
            case 'path.join':
                return path.join(...args)
            case 'path.relative':
                return path.relative(...args)
            case 'path.dirname':
                return path.dirname(args[0])
            case 'path.sep':
                return path.sep
            case 'fs.existsSync':
                return fs.existsSync(args[0])
            case 'fs.mkdirSync':
                return fs.mkdirSync(args[0])
            case 'fs.getFiles':
                return getFiles(args[0], args[1] === 'true')
            case 'child_process.spawn': {
                const scaffoldPath = args[0]
                const javaPath = args[1]
                const flags = args[2]
                const wrapperPath = path.join(scaffoldPath, GRADLE_WRAPPER)
                const options = { cwd: scaffoldPath }
                if (javaPath) options.env = { JAVA_HOME: javaPath }

                const child = child_process.spawn(wrapperPath, flags, options)

                const pid = await new Promise((resolve, reject) => {
                    child.on('error', reject)
                    child.on('spawn', () => {
                        const pid = child.pid.toString()

                        processes.set(pid, child)

                        child.stdout.on('data', (data) => {
                            event.sender.send('child_process.stdout', { pid, data: data.toString() })
                        })
                        child.stderr.on('data', (data) => {
                            event.sender.send('child_process.stderr', { pid, data: data.toString() })
                        })
                        child.on('exit', (code, signal) => {
                            processes.delete(child.pid)
                            event.sender.send('child_process.exit', {
                                pid,
                                code: (code ?? 0).toString(),
                                signal: (signal ?? 0).toString()
                            })
                        })

                        resolve(pid)
                    })
                })

                return pid
            }
            case 'child_process.kill': {
                const pid = args[0]
                if (processes.has(pid)) {
                    processes.get(pid).kill()
                }
                return
            }
            default:
                throw new Error('Invalid ipc API operation: ' + operation)
        }
    } catch (e) {
        return { ELECTRON_ERROR: e.toString() }
    }
})
