import * as flatbuffers from 'flatbuffers';
export declare class GameplayConstants {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GameplayConstants;
    static getRootAsGameplayConstants(bb: flatbuffers.ByteBuffer, obj?: GameplayConstants): GameplayConstants;
    static getSizePrefixedRootAsGameplayConstants(bb: flatbuffers.ByteBuffer, obj?: GameplayConstants): GameplayConstants;
    static startGameplayConstants(builder: flatbuffers.Builder): void;
    static endGameplayConstants(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createGameplayConstants(builder: flatbuffers.Builder): flatbuffers.Offset;
}
