import React from 'react'
import { GameRenderer } from '../playback/GameRenderer'

interface OptionProp {
    value: any
    selectedClass?: string
    className?: string
}

interface Props {
    options: Record<string, OptionProp>
    onChange: (value: any) => void
    flipOnRightClickCanvas?: boolean
}

export const Toggle: React.FC<Props> = (props: Props) => {
    const [value, setValue] = React.useState(Object.values(props.options)[0].value)
    const { canvasRightClick } = GameRenderer.useCanvasEvents()

    const onClick = (val: any) => {
        props.onChange(val)
        setValue(val)
    }

    React.useEffect(() => {
        if (props.flipOnRightClickCanvas) {
            const toggle = () => {
                const values = Object.values(props.options)
                onClick(values[canvasRightClick ? 1 : 0].value)
            }
            if (canvasRightClick) {
                toggle()
            } else {
                // do this after the event has been processed in other places to allow the right click to
                // process correctly (click to delete wouldnt work if toggle switched first)
                setTimeout(() => {
                    toggle()
                })
            }
        }
    }, [canvasRightClick])

    return (
        <div className="flex flex-row gap-0.5 border border-black p-0.5 rounded-md">
            {Object.entries(props.options).map(([label, option_props], i) => (
                <button
                    key={i}
                    onClick={() => onClick(option_props.value)}
                    className={
                        option_props.className +
                        ' flex flex-col transition rounded py-1 px-2 ' +
                        (value !== option_props.value
                            ? 'hover:bg-lightHighlight'
                            : option_props.selectedClass ?? 'text-white bg-darkHighlight')
                    }
                >
                    <span className={props.flipOnRightClickCanvas && i === 1 ? 'leading-3 mt-0.5' : ''}>{label}</span>
                    {props.flipOnRightClickCanvas && i === 1 && (
                        <span className="text-xxs leading-3 -mb-2 mt-px">right click</span>
                    )}
                </button>
            ))}
        </div>
    )
}
