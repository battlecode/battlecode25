import { useEffect, useState } from 'react'
import { AppState } from '../app-context'

export enum Hotkeys {
    EscapeDialog,
    MinimizeControlBar,
    Pause,
    ControlsNext,
    ControlsPrev,
    JumpToStart,
    JumpToEnd,
    BackSidebarPage,
    ForwardSidebarPage,
    JumpToQueue
}

const HotkeyDefs: Record<Hotkeys, Hotkey> = {
    [Hotkeys.EscapeDialog]: { key: 'Escape' },
    [Hotkeys.MinimizeControlBar]: { key: 'KeyC' },
    [Hotkeys.Pause]: { key: 'Space' },
    [Hotkeys.ControlsNext]: { key: 'ArrowRight' },
    [Hotkeys.ControlsPrev]: { key: 'ArrowLeft' },
    [Hotkeys.JumpToStart]: { key: 'Comma' },
    [Hotkeys.JumpToEnd]: { key: 'Period' },
    [Hotkeys.BackSidebarPage]: { key: 'Backquote' },
    [Hotkeys.ForwardSidebarPage]: { key: 'Digit1' },
    [Hotkeys.JumpToQueue]: { key: 'KeyO', ctrlOrMeta: true }
}

export function useHotkey(
    state: AppState,
    keyboard: KeyState,
    hotkeyName: Hotkeys,
    callback: () => void,
    defs: any[] = [],
    repeat: boolean = false
) {
    const deps = [state, keyboard.keyCode, keyboard.ctrlKey, keyboard.metaKey, hotkeyName, ...defs]
    if (repeat) deps.push(keyboard) // keyboard is recreated on repeat fire, so this makes it refire on native key repeat

    useEffect(() => {
        if (state.disableHotkeys) return
        const hotkey = HotkeyDefs[hotkeyName]
        if (keyboard.keyCode !== hotkey.key) return
        if (hotkey.ctrlOrMeta && !keyboard.ctrlKey && !keyboard.metaKey) return
        callback()
    }, deps)
}

export function useKeyboard(): KeyState {
    const [pressedKey, setKey] = useState<KeyState>(DEFAULT_KEY_STATE)

    useEffect(() => {
        const pressedCallback = (e: KeyboardEvent) =>
            setKey({
                keyCode: e.code,
                repeat: e.repeat,
                targetElem: e.target,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey
            })
        const releasedCallback = (e: KeyboardEvent) => setKey(DEFAULT_KEY_STATE)

        window.addEventListener('keydown', pressedCallback)
        window.addEventListener('keyup', releasedCallback)

        return () => {
            window.removeEventListener('keydown', pressedCallback)
            window.removeEventListener('keyup', releasedCallback)
        }
    }, [])

    return pressedKey
}

interface Hotkey {
    key: string
    ctrlOrMeta?: boolean
}

interface KeyState {
    keyCode: string
    repeat: boolean
    targetElem: EventTarget | null
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
}

const DEFAULT_KEY_STATE: KeyState = {
    keyCode: '',
    repeat: false,
    targetElem: null,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false
}
