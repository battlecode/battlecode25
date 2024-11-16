import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a tile's paint has been removed
 */
export declare class UnpaintAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): UnpaintAction;
    loc(): number;
    static sizeOf(): number;
    static createUnpaintAction(builder: flatbuffers.Builder, loc: number): flatbuffers.Offset;
}
