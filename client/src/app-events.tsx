import { useEffect } from 'react'

export enum EventType {
    TILE_CLICK = 'tileclick',
    TILE_DRAG = 'TILE_DRAG',
    CANVAS_RIGHT_CLICK = 'CANVAS_RIGHT_CLICK',
    RENDER = 'render',
    INITIAL_RENDER = 'initalrender'
}

export function useListenEvent(
    eventType: EventType,
    callback: (data: any, event: any) => void,
    deps?: React.DependencyList
) {
    const callbackWithData = (event: any) => {
        callback(event.detail, event)
    }

    useEffect(() => {
        document.addEventListener(eventType as string, callbackWithData)
        return () => {
            document.removeEventListener(eventType as string, callbackWithData)
        }
    }, deps)
}

export function publishEvent(eventType: string, eventData: any) {
    const event = new CustomEvent(eventType as string, { detail: eventData })
    document.dispatchEvent(event)
}
