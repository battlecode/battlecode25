import React from 'react'
import { MapEditorBrush } from './MapEditorBrush'
import { MapEditorBrushRowField } from './map-editor-field'
import { SectionHeader } from '../../section-header'

interface Props {
    brush: MapEditorBrush
    open: boolean
    onClick: () => void
}

export const MapEditorBrushRow: React.FC<Props> = (props: Props) => {
    const name = props.brush.name
    const fields = props.brush.fields
    return (
        <SectionHeader title={name} open={props.open} onClick={props.onClick}>
            <div className="flex flex-col border-b-2 border-gray mb-2 pb-3 pl-3">
                {Object.values(fields).map((field, i) => (
                    <div key={i} className="flex flex-row mt-1">
                        <MapEditorBrushRowField field={field} />
                    </div>
                ))}
            </div>
        </SectionHeader>
    )
}
