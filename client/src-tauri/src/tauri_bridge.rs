pub const SOURCE: &'static str = r#"
const { __TAURI__ } = window

const invokeArrayResult = (operation, data, ...args) =>
    __TAURI__.invoke('tauri_api', { operation, args, data })

const invokeSingleResult = async (operation, data, ...args) => {
    return (await invokeArrayResult(operation, data, ...args))[0]
}

const listenEvent = (name, callback) => __TAURI__.event.listen(name, (event) => {
    callback(event.payload)
})

const tauriAPI = {
    openScaffoldDirectory: (...args) => invokeSingleResult('openScaffoldDirectory', [], ...args),
    getRootPath: (...args) => invokeSingleResult('getRootPath', [], ...args),
    getJavas: (...args) => invokeArrayResult('getJavas', [], ...args),
    getPythons: (...args) => invokeArrayResult('getPythons', [], ...args),
    exportMap: (data, ...args) => invokeSingleResult('exportMap', data, ...args),
    getServerVersion: (...args) => invokeSingleResult('getServerVersion', [], ...args),
    path: {
        join: (...args) => invokeSingleResult('path.join', [], ...args),
        relative: (...args) => invokeSingleResult('path.relative', [], ...args),
        dirname: (...args) => invokeSingleResult('path.dirname', [], ...args),
        getSeperator: (...args) => invokeSingleResult('path.sep', [], ...args)
    },
    fs: {
        exists: (...args) => invokeSingleResult('fs.existsSync', [], ...args),
        mkdir: (...args) => invokeSingleResult('fs.mkdirSync', [], ...args),
        getFiles: (...args) => invokeArrayResult('fs.getFiles', [], ...args)
    },
    child_process: {
        // Combine arguments into one array
        spawn: (...args) => invokeSingleResult('child_process.spawn', [], args[0], args[1], ...args[2]),
        kill: (...args) => invokeSingleResult('child_process.kill', [], ...args),
        onStdout: (callback) => listenEvent('child-process-stdout', callback),
        onStderr: (callback) => listenEvent('child-process-stderr', callback),
        onExit: (callback) => listenEvent('child-process-exit', callback)
    }
}

window.tauriAPI = tauriAPI

console.log('Tauri API injected')
"#;
