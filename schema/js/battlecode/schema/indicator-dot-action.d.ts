import * as flatbuffers from 'flatbuffers';
/**
 * Update the indicator dot for this robot
 */
export declare class IndicatorDotAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): IndicatorDotAction;
    loc(): number;
    colorHex(): number;
    static sizeOf(): number;
    static createIndicatorDotAction(builder: flatbuffers.Builder, loc: number, colorHex: number): flatbuffers.Offset;
}
