import * as flatbuffers from 'flatbuffers';
/**
 * Update the indicator line for this robot
 */
export declare class IndicatorLineAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): IndicatorLineAction;
    startLoc(): number;
    endLoc(): number;
    colorHex(): number;
    static sizeOf(): number;
    static createIndicatorLineAction(builder: flatbuffers.Builder, startLoc: number, endLoc: number, colorHex: number): flatbuffers.Offset;
}
