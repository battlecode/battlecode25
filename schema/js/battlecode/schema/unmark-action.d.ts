import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a tile's marker has been removed
 */
export declare class UnmarkAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): UnmarkAction;
    loc(): number;
    static sizeOf(): number;
    static createUnmarkAction(builder: flatbuffers.Builder, loc: number): flatbuffers.Offset;
}
