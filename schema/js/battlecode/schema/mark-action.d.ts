import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a tile marked with a color
 */
export declare class MarkAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MarkAction;
    loc(): number;
    isSecondary(): number;
    static sizeOf(): number;
    static createMarkAction(builder: flatbuffers.Builder, loc: number, isSecondary: number): flatbuffers.Offset;
}
