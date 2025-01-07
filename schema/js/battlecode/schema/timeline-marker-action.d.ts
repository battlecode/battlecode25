import * as flatbuffers from 'flatbuffers';
/**
 * Adds a marker to the timeline at the current round
 */
export declare class TimelineMarkerAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TimelineMarkerAction;
    static getRootAsTimelineMarkerAction(bb: flatbuffers.ByteBuffer, obj?: TimelineMarkerAction): TimelineMarkerAction;
    static getSizePrefixedRootAsTimelineMarkerAction(bb: flatbuffers.ByteBuffer, obj?: TimelineMarkerAction): TimelineMarkerAction;
    label(): string | null;
    label(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startTimelineMarkerAction(builder: flatbuffers.Builder): void;
    static addLabel(builder: flatbuffers.Builder, labelOffset: flatbuffers.Offset): void;
    static endTimelineMarkerAction(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createTimelineMarkerAction(builder: flatbuffers.Builder, labelOffset: flatbuffers.Offset): flatbuffers.Offset;
}
