import * as flatbuffers from 'flatbuffers';
import { SpawnAction } from '../../battlecode/schema/spawn-action';
export declare class InitialBodyTable {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): InitialBodyTable;
    static getRootAsInitialBodyTable(bb: flatbuffers.ByteBuffer, obj?: InitialBodyTable): InitialBodyTable;
    static getSizePrefixedRootAsInitialBodyTable(bb: flatbuffers.ByteBuffer, obj?: InitialBodyTable): InitialBodyTable;
    robotIds(index: number): number | null;
    robotIdsLength(): number;
    robotIdsArray(): Int32Array | null;
    spawnActions(index: number, obj?: SpawnAction): SpawnAction | null;
    spawnActionsLength(): number;
    static startInitialBodyTable(builder: flatbuffers.Builder): void;
    static addRobotIds(builder: flatbuffers.Builder, robotIdsOffset: flatbuffers.Offset): void;
    static createRobotIdsVector(builder: flatbuffers.Builder, data: number[] | Int32Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createRobotIdsVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startRobotIdsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addSpawnActions(builder: flatbuffers.Builder, spawnActionsOffset: flatbuffers.Offset): void;
    static startSpawnActionsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endInitialBodyTable(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createInitialBodyTable(builder: flatbuffers.Builder, robotIdsOffset: flatbuffers.Offset, spawnActionsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
