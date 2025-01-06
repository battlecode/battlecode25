import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a mop attack
 */
export declare class MopAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MopAction;
    /**
     * Ids of the mopped targets, possibly 0
     */
    id0(): number;
    id1(): number;
    id2(): number;
    static sizeOf(): number;
    static createMopAction(builder: flatbuffers.Builder, id0: number, id1: number, id2: number): flatbuffers.Offset;
}
