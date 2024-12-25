import * as flatbuffers from 'flatbuffers';
import { ProfilerFile } from '../../battlecode/schema/profiler-file';
import { TimelineMarker } from '../../battlecode/schema/timeline-marker';
import { WinType } from '../../battlecode/schema/win-type';
/**
 * Sent to end a match.
 */
export declare class MatchFooter {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MatchFooter;
    static getRootAsMatchFooter(bb: flatbuffers.ByteBuffer, obj?: MatchFooter): MatchFooter;
    static getSizePrefixedRootAsMatchFooter(bb: flatbuffers.ByteBuffer, obj?: MatchFooter): MatchFooter;
    /**
     * The ID of the winning team.
     */
    winner(): number;
    /**
     * The reason for winning
     */
    winType(): WinType;
    /**
     * The number of rounds played.
     */
    totalRounds(): number;
    /**
     * Markers for this match.
     */
    timelineMarkers(index: number, obj?: TimelineMarker): TimelineMarker | null;
    timelineMarkersLength(): number;
    /**
     * Profiler data for team A and B if profiling is enabled.
     */
    profilerFiles(index: number, obj?: ProfilerFile): ProfilerFile | null;
    profilerFilesLength(): number;
    static startMatchFooter(builder: flatbuffers.Builder): void;
    static addWinner(builder: flatbuffers.Builder, winner: number): void;
    static addWinType(builder: flatbuffers.Builder, winType: WinType): void;
    static addTotalRounds(builder: flatbuffers.Builder, totalRounds: number): void;
    static addTimelineMarkers(builder: flatbuffers.Builder, timelineMarkersOffset: flatbuffers.Offset): void;
    static createTimelineMarkersVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startTimelineMarkersVector(builder: flatbuffers.Builder, numElems: number): void;
    static addProfilerFiles(builder: flatbuffers.Builder, profilerFilesOffset: flatbuffers.Offset): void;
    static createProfilerFilesVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startProfilerFilesVector(builder: flatbuffers.Builder, numElems: number): void;
    static endMatchFooter(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createMatchFooter(builder: flatbuffers.Builder, winner: number, winType: WinType, totalRounds: number, timelineMarkersOffset: flatbuffers.Offset, profilerFilesOffset: flatbuffers.Offset): flatbuffers.Offset;
}
