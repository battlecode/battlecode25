import { GameRenderer } from '../playback/GameRenderer'

const IMAGE_DIRECTORY = 'static/img/'

const imgCache = new Map<string, Promise<HTMLImageElement>>()
const loadedImgCache = new Map<string, HTMLImageElement>()
const onLoadCallbacks = new Map<string, (() => void)[]>()

/**
 * @param path the path of the image
 * @returns the full path to the image
 */
export const imageSource = (path: string) => `${IMAGE_DIRECTORY}${path}`

/**
 * @param path the path of the image to load
 * @returns a promise that resolves to the image once the image has been loaded
 */
export const loadImage = (path: string): Promise<HTMLImageElement> => {
    if (imgCache.has(path)) return imgCache.get(path)!

    const img = new Image()
    img.src = imageSource(path)

    const loading = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => {
            loadedImgCache.set(path, img)
            resolve(img)
            onLoadCallbacks.get(path)?.forEach((callback) => callback())
            onLoadCallbacks.get('')?.forEach((callback) => callback())

            // We want to rerender when an image loads so the user
            // doesn't have to look at placeholders until they progress the turn
            GameRenderer.fullRender()
        }
        img.onerror = reject
    })
    loading.catch((e) => {
        throw new Error(`Failed to load image ${path}: ${e}`)
    })

    imgCache.set(path, loading)
    return loading
}

/**
 * Returns an image if it has been loaded, or undefined.
 * Starts loading the image if it has not been loaded already
 *
 * @param path the path of the image to load
 * @returns the image if it has already been loaded, or undefined otherwise
 */
export const getImageIfLoaded = (path: string) => {
    if (loadedImgCache.has(path)) return loadedImgCache.get(path)
    loadImage(path)
    return undefined
}

/**
 * Calls the callback once an image loads
 * @param callback the callback to call once any image loads
 * @param path the path to the image that when loaded will trigger the callback. if an empty string
 *             is used, then the callback will be called on any image
 */
export const triggerOnImageLoad = (callback: () => void, path: string = '') => {
    if (!onLoadCallbacks.has(path)) {
        onLoadCallbacks.set(path, [])
    }
    onLoadCallbacks.get(path)?.push(callback)
}

/**
 * Removes a stored callback (see triggerOnImageLoad for details on parameters)
 * @param callback the callback that was stored
 * @param path the path to the image that was used to register the callback
 */
export const removeTriggerOnImageLoad = (callback: () => void, path: string = '') => {
    const index = onLoadCallbacks.get(path)?.indexOf(callback)
    if (index !== -1 && index !== undefined) {
        onLoadCallbacks.get(path)?.splice(index, 1)
    }
}
