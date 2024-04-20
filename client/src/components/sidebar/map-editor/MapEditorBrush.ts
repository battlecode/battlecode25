import { StaticMap, CurrentMap } from '../../../current-game/Map'

export abstract class MapEditorBrush {
    abstract name: string
    abstract fields: Record<string, MapEditorBrushField>
    abstract apply(x: number, y: number, fields: Record<string, MapEditorBrushField>): void
    public open: boolean = false

    public opened(open: boolean): MapEditorBrush {
        const newBrush = { ...this, open: open }
        Object.setPrototypeOf(newBrush, Object.getPrototypeOf(this))
        return newBrush
    }
}
/**
 * A brush that applies the exact same operation to both the given point and its symmetric counterpart.
 */
export abstract class SymmetricMapEditorBrush<MapType extends CurrentMap | StaticMap> extends MapEditorBrush {
    abstract symmetricApply(x: number, y: number, fields: Record<string, MapEditorBrushField>): void

    constructor(protected readonly map: MapType) {
        super()
    }
    apply(x: number, y: number, fields: Record<string, MapEditorBrushField>): void {
        this.symmetricApply(x, y, fields)
        const symmetryPoint = this.map.applySymmetry({ x: x, y: y })
        if (symmetryPoint.x != x || symmetryPoint.y != y) this.symmetricApply(symmetryPoint.x, symmetryPoint.y, fields)
    }
}

export interface MapEditorBrushField {
    type: MapEditorBrushFieldType
    value: any
    label?: string
    options?: { value: any; label: string }[]
    min?: number
    max?: number
}

export enum MapEditorBrushFieldType {
    POSITIVE_INTEGER,
    ADD_REMOVE,
    TEAM,
    SINGLE_SELECT
}

export enum Symmetry {
    ROTATIONAL,
    HORIZONTAL,
    VERTICAL
}
