import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a mop attack
 */
export declare class MopAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MopAction;
    loc(): number;
    static sizeOf(): number;
    static createMopAction(builder: flatbuffers.Builder, loc: number): flatbuffers.Offset;
}
