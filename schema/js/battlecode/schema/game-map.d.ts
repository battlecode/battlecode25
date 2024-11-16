import * as flatbuffers from 'flatbuffers';
import { InitialBodyTable } from '../../battlecode/schema/initial-body-table';
import { Vec } from '../../battlecode/schema/vec';
import { VecTable } from '../../battlecode/schema/vec-table';
export declare class GameMap {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GameMap;
    static getRootAsGameMap(bb: flatbuffers.ByteBuffer, obj?: GameMap): GameMap;
    static getSizePrefixedRootAsGameMap(bb: flatbuffers.ByteBuffer, obj?: GameMap): GameMap;
    name(): string | null;
    name(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    size(obj?: Vec): Vec | null;
    symmetry(): number;
    initialBodies(obj?: InitialBodyTable): InitialBodyTable | null;
    randomSeed(): number;
    walls(index: number): boolean | null;
    wallsLength(): number;
    wallsArray(): Int8Array | null;
    paint(index: number): boolean | null;
    paintLength(): number;
    paintArray(): Int8Array | null;
    ruins(obj?: VecTable): VecTable | null;
    static startGameMap(builder: flatbuffers.Builder): void;
    static addName(builder: flatbuffers.Builder, nameOffset: flatbuffers.Offset): void;
    static addSize(builder: flatbuffers.Builder, sizeOffset: flatbuffers.Offset): void;
    static addSymmetry(builder: flatbuffers.Builder, symmetry: number): void;
    static addInitialBodies(builder: flatbuffers.Builder, initialBodiesOffset: flatbuffers.Offset): void;
    static addRandomSeed(builder: flatbuffers.Builder, randomSeed: number): void;
    static addWalls(builder: flatbuffers.Builder, wallsOffset: flatbuffers.Offset): void;
    static createWallsVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startWallsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addPaint(builder: flatbuffers.Builder, paintOffset: flatbuffers.Offset): void;
    static createPaintVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startPaintVector(builder: flatbuffers.Builder, numElems: number): void;
    static addRuins(builder: flatbuffers.Builder, ruinsOffset: flatbuffers.Offset): void;
    static endGameMap(builder: flatbuffers.Builder): flatbuffers.Offset;
}
