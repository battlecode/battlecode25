import * as flatbuffers from 'flatbuffers';
/**
 * Indicates that the robot died due to an uncaught exception
 */
export declare class DieExceptionAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DieExceptionAction;
    value(): number;
    static sizeOf(): number;
    static createDieExceptionAction(builder: flatbuffers.Builder, value: number): flatbuffers.Offset;
}
