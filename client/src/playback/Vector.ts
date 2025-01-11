export interface Vector {
    x: number
    y: number
}

export const getEmptyVector = () => ({ x: 0, y: 0 }) as Vector
export const vectorLength = (a: Vector) => Math.sqrt(a.x * a.x + a.y * a.y)
export const vectorLengthSquared = (a: Vector) => a.x * a.x + a.y * a.y
export const vectorEq = (a: Vector, b: Vector) => a.x === b.x && a.y === b.y
export const vectorDot = (a: Vector, b: Vector) => a.x * b.x + a.y * b.y
export const vectorAdd = (a: Vector, b: Vector) => ({ x: a.x + b.x, y: a.y + b.y })
export const vectorSub = (a: Vector, b: Vector) => ({ x: a.x - b.x, y: a.y - b.y })
export const vectorMultiply = (a: Vector, b: number) => ({ x: a.x * b, y: a.y * b })
export const vectorDist = (a: Vector, b: Vector) => vectorLength({ x: b.x - a.x, y: b.y - a.y })
export const vectorDistSquared = (a: Vector, b: Vector) => vectorLengthSquared({ x: b.x - a.x, y: b.y - a.y })
export const vectorAddInPlace = (a: Vector, b: Vector) => {
    a.x += b.x
    a.y += b.y
}
export const vectorSubInPlace = (a: Vector, b: Vector) => {
    a.x -= b.x
    a.y -= b.y
}
export const vectorMultiplyInPlace = (a: Vector, b: number) => {
    a.x *= b
    a.y *= b
}

export interface InterpVector {
    start: Vector
    end: Vector
}

export const getEmptyInterpVector = () => ({ start: getEmptyVector(), end: getEmptyVector() }) as InterpVector
