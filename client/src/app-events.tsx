import { useEffect } from 'react'

export enum EventType {
    NEW_TURN = 'NEW_TURN',
    TILE_CLICK = 'TILE_CLICK',
    TILE_DRAG = 'TILE_DRAG',
    CANVAS_RIGHT_CLICK = 'CANVAS_RIGHT_CLICK',
    RENDER = 'RENDER',
    MAP_RENDER = 'MAP_RENDER'
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

export function publishEvent(eventType: string, eventData: any = false) {
    const event = new CustomEvent(eventType as string, { detail: eventData })
    document.dispatchEvent(event)
}
