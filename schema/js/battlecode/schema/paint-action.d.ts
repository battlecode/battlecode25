import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a tile has been painted
 */
export declare class PaintAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): PaintAction;
    loc(): number;
    isSecondary(): number;
    static sizeOf(): number;
    static createPaintAction(builder: flatbuffers.Builder, loc: number, isSecondary: number): flatbuffers.Offset;
}
