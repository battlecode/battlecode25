import { flatbuffers, schema } from 'battlecode-schema'
import { Vector } from './vector'

export const parseVecTable = (value: schema.VecTable) => {
    const result: Vector[] = []
    for (let i = 0; i < value.xsLength(); i++) {
        result.push({ x: value.xs(i) ?? 0, y: value.ys(i) ?? 0 })
    }
    return result
}

export const packVecTable = (builder: flatbuffers.Builder, values: Vector[]) => {
    const xsTable = schema.VecTable.createXsVector(
        builder,
        values.map((v) => v.x)
    )
    const ysTable = schema.VecTable.createYsVector(
        builder,
        values.map((v) => v.y)
    )
    schema.VecTable.startVecTable(builder)
    schema.VecTable.addXs(builder, xsTable)
    schema.VecTable.addYs(builder, ysTable)
    return schema.VecTable.endVecTable(builder)
}
