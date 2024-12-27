import * as flatbuffers from 'flatbuffers';
/**
 * Update the indicator string for this robot
 */
export declare class IndicatorStringAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): IndicatorStringAction;
    static getRootAsIndicatorStringAction(bb: flatbuffers.ByteBuffer, obj?: IndicatorStringAction): IndicatorStringAction;
    static getSizePrefixedRootAsIndicatorStringAction(bb: flatbuffers.ByteBuffer, obj?: IndicatorStringAction): IndicatorStringAction;
    value(): string | null;
    value(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startIndicatorStringAction(builder: flatbuffers.Builder): void;
    static addValue(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): void;
    static endIndicatorStringAction(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createIndicatorStringAction(builder: flatbuffers.Builder, valueOffset: flatbuffers.Offset): flatbuffers.Offset;
}
