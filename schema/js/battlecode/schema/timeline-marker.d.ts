import * as flatbuffers from 'flatbuffers';
/**
 * Markers for events during the game indicated by the user
 */
export declare class TimelineMarker {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TimelineMarker;
    static getRootAsTimelineMarker(bb: flatbuffers.ByteBuffer, obj?: TimelineMarker): TimelineMarker;
    static getSizePrefixedRootAsTimelineMarker(bb: flatbuffers.ByteBuffer, obj?: TimelineMarker): TimelineMarker;
    team(): number;
    round(): number;
    colorHex(): number;
    label(): string | null;
    label(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    static startTimelineMarker(builder: flatbuffers.Builder): void;
    static addTeam(builder: flatbuffers.Builder, team: number): void;
    static addRound(builder: flatbuffers.Builder, round: number): void;
    static addColorHex(builder: flatbuffers.Builder, colorHex: number): void;
    static addLabel(builder: flatbuffers.Builder, labelOffset: flatbuffers.Offset): void;
    static endTimelineMarker(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createTimelineMarker(builder: flatbuffers.Builder, team: number, round: number, colorHex: number, labelOffset: flatbuffers.Offset): flatbuffers.Offset;
}
