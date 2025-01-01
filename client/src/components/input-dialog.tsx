import React, { PropsWithChildren } from 'react'
import { BasicDialog } from './basic-dialog'

interface Props {
    open: boolean
    onClose: (val: string) => void
    title: string
    description?: string
    className?: string
    placeholder?: string
    defaultValue?: string
}

export const InputDialog: React.FC<PropsWithChildren<Props>> = (props) => {
    const [value, setValue] = React.useState('')

    React.useEffect(() => {
        if (props.open) {
            setValue(props.defaultValue ?? '')
        }
    }, [props.open])

    return (
        <BasicDialog
            {...props}
            rightButtonDisabled={value == ''}
            onCancel={() => props.onClose('')}
            onConfirm={() => props.onClose(value)}
        >
            <input
                className="rounded-md px-4 py-2 bg-inherit border-[1px] border-white w-full"
                type={'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={props.placeholder}
            />
            {props.children}
        </BasicDialog>
    )
}
