import { SetURLSearchParams, useSearchParams } from 'react-router-dom'

export enum PageType {
    GAME = 'Game',
    QUEUE = 'Queue',
    RUNNER = 'Runner',
    MAP_EDITOR = 'Map Editor',
    HELP = 'Help',
    TOURNAMENT = 'Tournament',
    CONFIG = 'Config'
}

function updateSearchParams(
    searchParams: URLSearchParams,
    setSearchParams: SetURLSearchParams,
    key: string,
    value: any
) {
    const newParams = Object.assign(
        {},
        [...searchParams.entries()].reduce((o, [key, value]) => ({ ...o, [key]: value }), {}),
        { [key]: value }
    )
    setSearchParams(newParams)
}

export function usePage(): readonly [PageType, (newPage: PageType) => void] {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = (searchParams.get('page') as PageType) ?? PageType.GAME

    const setPage = (newPage: PageType) => {
        updateSearchParams(searchParams, setSearchParams, 'page', newPage)
    }
    return [page, setPage]
}

export function useSearchParamBool(
    paramName: string,
    defaultValue: boolean
): readonly [boolean, (newValue: boolean) => void] {
    const [searchParams, setSearchParams] = useSearchParams()
    const value = (searchParams.get(paramName) ?? (defaultValue ? '1' : '0')) === '1'

    const setValue = (newValue: boolean) => {
        updateSearchParams(searchParams, setSearchParams, paramName, newValue ? '1' : '0')
    }
    return [value, setValue]
}

export function useSearchParamString(
    paramName: string,
    defaultValue: string
): readonly [string, (newValue: string) => void] {
    const [searchParams, setSearchParams] = useSearchParams()
    const value = searchParams.get(paramName) ?? defaultValue

    const setValue = (newValue: string) => {
        updateSearchParams(searchParams, setSearchParams, paramName, newValue)
    }
    return [value, setValue]
}

export function useSearchParamNumber(
    paramName: string,
    defaultValue: number
): readonly [number, (newValue: number) => void] {
    const [searchParams, setSearchParams] = useSearchParams()
    const param = searchParams.get(paramName)
    const value = param ? parseInt(param) : defaultValue

    const setValue = (newValue: number) => {
        updateSearchParams(searchParams, setSearchParams, paramName, newValue.toString())
    }
    return [value, setValue]
}
