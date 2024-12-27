export class RingBuffer<T> {
    private _array: T[]
    private _effectiveLength: number

    constructor(n: number) {
        this._array = new Array(n)
        this._effectiveLength = 0
    }

    public toString() {
        return '[object RingBuffer(' + this._array.length + ') effectiveLength ' + this._effectiveLength + ']'
    }

    public length() {
        return Math.min(this._array.length, this._effectiveLength)
    }

    public effectiveLength() {
        return this._effectiveLength
    }

    public get(i: number) {
        if (i < 0 || i >= this.length()) return undefined
        const index = this.computeActualIndex(i)
        return this._array[index]
    }

    public set(i: number, v: T) {
        if (i < 0 || i >= this.length()) throw new Error('set() Index out of range')
        const index = this.computeActualIndex(i)
        this._array[index] = v
    }

    public push(v: T) {
        const index = this.computeActualIndex(this._effectiveLength)
        this._array[index] = v
        this._effectiveLength++
    }

    public pop(): T | undefined {
        if (this._effectiveLength === 0) return undefined
        const index = this.computeActualIndex(this._effectiveLength - 1)
        const value = this._array[index]
        this._array[index] = undefined as any
        this._effectiveLength--
        return value
    }

    public clear() {
        this._effectiveLength = 0
    }

    public *[Symbol.iterator]() {
        for (let i = 0; i < this.length(); i++) {
            yield this.get(i)
        }
    }

    private computeActualIndex(offset: number) {
        return Math.max((this._effectiveLength - this._array.length, 0) + offset) % this._array.length
    }
}
