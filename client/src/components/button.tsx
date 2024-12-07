import React, { MouseEvent, PropsWithChildren } from 'react'

type Props = {
    className?: string
    onClick: (event: MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
}

export const Button = (props: PropsWithChildren<Props>) => {
    return (
        <button
            className={
                'text-xs mx-auto px-4 py-3 mt-1 mb-3 flex flex-row bg-light hover:bg-lightHighlight border-black border rounded-md ' +
                (props.className ?? '') +
                (props.disabled ? ' opacity-50 cursor-not-allowed' : '')
            }
            onClick={props.onClick}
        >
            {props.children}
        </button>
    )
}

export const SmallButton = (props: PropsWithChildren<Props>) => (
    <button
        className={
            'text-xs mx-auto px-4 py-1 mt-1 mb-2 flex flex-row bg-light hover:bg-lightHighlight border-black border rounded-md ' +
            (props.className ?? '')
        }
        onClick={props.onClick}
    >
        {props.children}
    </button>
)

export const BrightButton = (props: PropsWithChildren<Props>) => (
    <button
        className={
            'text-xs mx-auto px-4 py-3 mt-1 mb-3 flex flex-row bg-cyan hover:bg-cyanDark rounded-md text-white' +
            (props.className ?? '')
        }
        onClick={props.onClick}
    >
        {props.children}
    </button>
)
