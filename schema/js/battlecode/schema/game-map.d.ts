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
    water(index: number): boolean | null;
    waterLength(): number;
    waterArray(): Int8Array | null;
    divider(index: number): boolean | null;
    dividerLength(): number;
    dividerArray(): Int8Array | null;
    spawnLocations(obj?: VecTable): VecTable | null;
    resourcePiles(obj?: VecTable): VecTable | null;
    resourcePileAmounts(index: number): number | null;
    resourcePileAmountsLength(): number;
    resourcePileAmountsArray(): Int32Array | null;
    static startGameMap(builder: flatbuffers.Builder): void;
    static addName(builder: flatbuffers.Builder, nameOffset: flatbuffers.Offset): void;
    static addSize(builder: flatbuffers.Builder, sizeOffset: flatbuffers.Offset): void;
    static addSymmetry(builder: flatbuffers.Builder, symmetry: number): void;
    static addInitialBodies(builder: flatbuffers.Builder, initialBodiesOffset: flatbuffers.Offset): void;
    static addRandomSeed(builder: flatbuffers.Builder, randomSeed: number): void;
    static addWalls(builder: flatbuffers.Builder, wallsOffset: flatbuffers.Offset): void;
    static createWallsVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startWallsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addWater(builder: flatbuffers.Builder, waterOffset: flatbuffers.Offset): void;
    static createWaterVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startWaterVector(builder: flatbuffers.Builder, numElems: number): void;
    static addDivider(builder: flatbuffers.Builder, dividerOffset: flatbuffers.Offset): void;
    static createDividerVector(builder: flatbuffers.Builder, data: boolean[]): flatbuffers.Offset;
    static startDividerVector(builder: flatbuffers.Builder, numElems: number): void;
    static addSpawnLocations(builder: flatbuffers.Builder, spawnLocationsOffset: flatbuffers.Offset): void;
    static addResourcePiles(builder: flatbuffers.Builder, resourcePilesOffset: flatbuffers.Offset): void;
    static addResourcePileAmounts(builder: flatbuffers.Builder, resourcePileAmountsOffset: flatbuffers.Offset): void;
    static createResourcePileAmountsVector(builder: flatbuffers.Builder, data: number[] | Int32Array): flatbuffers.Offset;
    /**
     * @deprecated This Uint8Array overload will be removed in the future.
     */
    static createResourcePileAmountsVector(builder: flatbuffers.Builder, data: number[] | Uint8Array): flatbuffers.Offset;
    static startResourcePileAmountsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endGameMap(builder: flatbuffers.Builder): flatbuffers.Offset;
}
