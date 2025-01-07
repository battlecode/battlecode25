import { StaticMap, CurrentMap } from '../../../playback/Map'

export type UndoFunction = (() => void) | undefined
export abstract class MapEditorBrush {
    abstract name: string
    abstract fields: Record<string, MapEditorBrushField>
    abstract apply(x: number, y: number, fields: Record<string, MapEditorBrushField>, robotOne: boolean): UndoFunction
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
    abstract symmetricApply(
        x: number,
        y: number,
        fields: Record<string, MapEditorBrushField>,
        robotOne: boolean
    ): UndoFunction | null

    constructor(protected readonly map: MapType) {
        super()
    }

    apply(x: number, y: number, fields: Record<string, MapEditorBrushField>, robotOne: boolean): UndoFunction {
        const undoFunctions: UndoFunction[] = []
        const undo0 = this.symmetricApply(x, y, fields, robotOne)

        // Return early if brush could not be applied
        if (!undo0) return () => {}

        undoFunctions.push(undo0)

        const symmetryPoint = this.map.applySymmetry({ x: x, y: y })
        if (symmetryPoint.x != x || symmetryPoint.y != y) {
            const undo1 = this.symmetricApply(symmetryPoint.x, symmetryPoint.y, fields, !robotOne)

            // If the symmetry is not applied, revert the original change
            if (!undo1) {
                undo0()
                return () => {}
            }

            undoFunctions.push(undo1)
        }

        return () => undoFunctions.forEach((f) => f && f())
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
