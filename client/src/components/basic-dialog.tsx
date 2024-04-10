import React, { PropsWithChildren } from 'react'
import { useAppContext } from '../app-context'
import { useKeyboard } from '../util/keyboard'
import { useHotkeys } from '../util/hotkeys'

interface Props {
    open: boolean
    title: string
    description?: string
    className?: string
    onCancel?: () => void
    onConfirm?: () => void
    leftButtonDisabled?: boolean
    rightButtonDisabled?: boolean
    leftText?: string
    rightText?: string
    width?: 'sm' | 'md' | 'lg' | 'full'
}

export const BasicDialog: React.FC<PropsWithChildren<Props>> = (props) => {
    const context = useAppContext()
    const keyboard = useKeyboard()

    useHotkeys(
        {
            EscapeDialog: () => {
                if (props.open && props.onCancel) {
                    props.onCancel()
                }
            }
        },
        [props.open, props.onCancel]
    )

    React.useEffect(() => {
        if (!props.open) return

        if (props.onCancel && keyboard.keyCode === 'Escape') {
            props.onCancel()
        }
    }, [props.open, keyboard.keyCode])

    React.useEffect(() => {
        context.setState((prevState) => ({ ...prevState, disableHotkeys: props.open }))
    }, [props.open])

    if (!props.open) return <></>

    const leftText = props.leftText ?? 'Cancel'
    const rightText = props.rightText ?? 'Confirm'
    const widthType = props.width ?? 'md'
    const widthStyle =
        widthType == 'sm'
            ? 'w-4/6 md:w-3/5 lg:w-6/12'
            : widthType == 'md'
              ? 'w-5/6 md:w-3/4 lg:w-7/12'
              : widthType == 'lg'
                ? 'w-5/6 md:w-4/5 lg:w-9/12'
                : widthType == 'full'
                  ? 'w-5/6 md:w-5/6 lg:w-11/12'
                  : ''
    return (
        <div className="fixed flex flex-col items-center justify-center w-full h-full top-0 left-0 bg-gray-500 bg-opacity-50 z-50">
            <div
                className={
                    'flex flex-col flex-between items-center bg-white border border-black shadow-lg rounded-xl py-4 px-6 ' +
                    widthStyle
                }
            >
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="font-display text-2xl font-medium">{props.title}</div>
                </div>
                {props.description && <div className="text-md w-full mt-3">{props.description}</div>}
                <div className="w-full my-4 overflow-y-auto">{props.children}</div>
                <div className="flex flex-row justify-between items-center w-full">
                    {props.onCancel ? (
                        <button
                            disabled={props.leftButtonDisabled}
                            onClick={() => props.onCancel && props.onCancel()}
                            className="hover:brightness-90 transition cursor-pointer text-md font-display rounded-[6px] px-5 py-1.5"
                            style={{ opacity: props.leftButtonDisabled ? 0.5 : 1.0 }}
                        >
                            {leftText}
                        </button>
                    ) : (
                        <div />
                    )}
                    {props.onConfirm ? (
                        <button
                            disabled={props.rightButtonDisabled}
                            onClick={() => props.onConfirm && props.onConfirm()}
                            className={`bg-gradient-to-tr from-purple-gradient-light-start to-purple-gradient-light-end p-[1px] rounded-[7px]`}
                            style={{ opacity: props.rightButtonDisabled ? 0.5 : 1.0 }}
                        >
                            <div className="hover:brightness-90 transition cursor-pointer text-md font-display rounded-[6px] px-5 py-1.5">
                                {rightText}
                            </div>
                        </button>
                    ) : (
                        <div />
                    )}
                </div>
            </div>
        </div>
    )
}
