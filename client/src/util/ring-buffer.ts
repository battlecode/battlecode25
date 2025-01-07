export class RingBuffer<T> {
    private _array: T[]
    private _effectiveLength: number
    private _head: number
    private _tail: number
    private _count: number

    constructor(n: number) {
        this._array = new Array(n)
        this._effectiveLength = 0
        this._head = 0
        this._tail = 0
        this._count = 0
    }

    public toString() {
        return '[object RingBuffer(' + this._array.length + ') count ' + this._count + ']'
    }

    public length() {
        return this._count
    }

    public effectiveLength() {
        return this._effectiveLength
    }

    public get(i: number) {
        if (i < 0 || i >= this.length()) {
            return undefined
        }
        const index = this.computeActualIndex(i)
        return this._array[index]
    }

    public set(i: number, v: T) {
        if (i < 0 || i >= this.length()) {
            throw new RangeError('set() Index out of range')
        }
        const index = this.computeActualIndex(i)
        this._array[index] = v
    }

    public push(v: T) {
        this._effectiveLength++
        this._array[this._tail] = v
        this._tail = (this._tail + 1) % this._array.length
        if (this._count === this._array.length) {
            this._head = (this._head + 1) % this._array.length
        } else {
            this._count++
        }
    }

    public pop(): T | undefined {
        if (this.length() === 0) {
            return undefined
        }
        const lastElemIdx = (this._tail + this._array.length - 1) % this._array.length
        const value = this._array[lastElemIdx]
        this._array[lastElemIdx] = undefined as any
        this._tail = lastElemIdx
        this._count--
        this._effectiveLength--
        return value
    }

    public clear() {
        this._head = 0
        this._tail = 0
        this._count = 0
        this._effectiveLength = 0
    }

    public *[Symbol.iterator]() {
        for (let i = 0; i < this.length(); i++) {
            yield this.get(i)
        }
    }

    private computeActualIndex(offset: number) {
        return (this._head + offset) % this._array.length
    }
}
