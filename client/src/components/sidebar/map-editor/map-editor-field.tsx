import React from 'react'
import { MapEditorBrushField, MapEditorBrushFieldType } from './MapEditorBrush'
import { TEAM_COLOR_NAMES } from '../../../constants'
import { Toggle } from '../../toggle'
import { Select, NumInput } from '../../forms'

interface Props {
    field: MapEditorBrushField
}

export const MapEditorBrushRowField: React.FC<Props> = (props: Props) => {
    const type = props.field.type
    const [value, setValue] = React.useState(props.field.value)
    const label = props.field.label
    const options = props.field.options

    const changeValue = (newValue: number) => {
        props.field.value = newValue
        setValue(newValue)
    }

    let field
    switch (type) {
        case MapEditorBrushFieldType.POSITIVE_INTEGER:
            field = (
                <div className="flex flex-col">
                    <span className="mr-2 text-sm">{label}</span>
                    <NumInput
                        value={value}
                        changeValue={changeValue}
                        min={props.field.min ?? 0}
                        max={props.field.max ?? 9999}
                    />
                </div>
            )
            break
        case MapEditorBrushFieldType.ADD_REMOVE:
            field = (
                <Toggle
                    options={{ Add: { value: true }, Remove: { value: false } }}
                    onChange={changeValue}
                    flipOnRightClickCanvas={true}
                />
            )
            break
        case MapEditorBrushFieldType.TEAM:
            field = (
                <Toggle
                    options={{
                        [TEAM_COLOR_NAMES[0]]: { value: 0, selectedClass: 'bg-red' },
                        [TEAM_COLOR_NAMES[1]]: { value: 1, selectedClass: 'bg-blueLight' }
                    }}
                    onChange={changeValue}
                />
            )
            break
        case MapEditorBrushFieldType.SINGLE_SELECT:
            field = (
                <div className="flex flex-col">
                    <span className="mr-2 text-sm">{label}</span>
                    <Select value={value} onChange={(v) => changeValue(parseInt(v))}>
                        {options?.map((option, i) => (
                            <option key={i} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
            )
            break
        default:
            throw new Error('Unknown map editor field type: ' + type)
    }

    return <div className="flex flex-row mt-1">{field}</div>
}
