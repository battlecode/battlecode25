import * as flatbuffers from 'flatbuffers';
export declare class GameplayConstants {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GameplayConstants;
    static getRootAsGameplayConstants(bb: flatbuffers.ByteBuffer, obj?: GameplayConstants): GameplayConstants;
    static getSizePrefixedRootAsGameplayConstants(bb: flatbuffers.ByteBuffer, obj?: GameplayConstants): GameplayConstants;
    baseHealth(index: number): number | null;
    baseHealthLength(): number;
    baseHealthArray(): Int32Array | null;
    visionRadius(index: number): number | null;
    visionRadiusLength(): number;
    visionRadiusArray(): Int32Array | null;
    actionRadius(index: number): number | null;
    actionRadiusLength(): number;
    actionRadiusArray(): Int32Array | null;
    static startGameplayConstants(builder: flatbuffers.Builder): void;
    static addBaseHealth(builder: flatbuffers.Builder, baseHealthOffset: flatbuffers.Offset): void;
    static createBaseHealthVector(builder: flatbuffers.Builder, data: number[] | Int32Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createBaseHealthVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startBaseHealthVector(builder: flatbuffers.Builder, numElems: number): void;
    static addVisionRadius(builder: flatbuffers.Builder, visionRadiusOffset: flatbuffers.Offset): void;
    static createVisionRadiusVector(builder: flatbuffers.Builder, data: number[] | Int32Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createVisionRadiusVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startVisionRadiusVector(builder: flatbuffers.Builder, numElems: number): void;
    static addActionRadius(builder: flatbuffers.Builder, actionRadiusOffset: flatbuffers.Offset): void;
    static createActionRadiusVector(builder: flatbuffers.Builder, data: number[] | Int32Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createActionRadiusVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startActionRadiusVector(builder: flatbuffers.Builder, numElems: number): void;
    static endGameplayConstants(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createGameplayConstants(builder: flatbuffers.Builder, baseHealthOffset: flatbuffers.Offset, visionRadiusOffset: flatbuffers.Offset, actionRadiusOffset: flatbuffers.Offset): flatbuffers.Offset;
}
