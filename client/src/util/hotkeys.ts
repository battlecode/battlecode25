import { useEffect } from 'react'
import { useKeyboard } from './keyboard'

enum Hotkeys {
    EscapeDialog = 'Escape',
}

export const useHotkeys = (hotkeys: Record<string, () => void>) => {
    const key = useKeyboard()
    useEffect(() => {
        if (hotkeys[key.keyCode]) {
            hotkeys[key.keyCode]()
        }
    }, [key.keyCode])
}
