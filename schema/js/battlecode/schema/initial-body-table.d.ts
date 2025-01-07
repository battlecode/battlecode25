import * as flatbuffers from 'flatbuffers';
import { SpawnAction } from '../../battlecode/schema/spawn-action';
export declare class InitialBodyTable {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): InitialBodyTable;
    static getRootAsInitialBodyTable(bb: flatbuffers.ByteBuffer, obj?: InitialBodyTable): InitialBodyTable;
    static getSizePrefixedRootAsInitialBodyTable(bb: flatbuffers.ByteBuffer, obj?: InitialBodyTable): InitialBodyTable;
    spawnActions(index: number, obj?: SpawnAction): SpawnAction | null;
    spawnActionsLength(): number;
    static startInitialBodyTable(builder: flatbuffers.Builder): void;
    static addSpawnActions(builder: flatbuffers.Builder, spawnActionsOffset: flatbuffers.Offset): void;
    static startSpawnActionsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endInitialBodyTable(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createInitialBodyTable(builder: flatbuffers.Builder, spawnActionsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
