import * as flatbuffers from 'flatbuffers';
import { GameplayConstants } from '../../battlecode/schema/gameplay-constants';
import { RobotTypeMetadata } from '../../battlecode/schema/robot-type-metadata';
import { TeamData } from '../../battlecode/schema/team-data';
/**
 * The first event sent in the game. Contains all metadata about the game.
 */
export declare class GameHeader {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): GameHeader;
    static getRootAsGameHeader(bb: flatbuffers.ByteBuffer, obj?: GameHeader): GameHeader;
    static getSizePrefixedRootAsGameHeader(bb: flatbuffers.ByteBuffer, obj?: GameHeader): GameHeader;
    specVersion(): string | null;
    specVersion(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    teams(index: number, obj?: TeamData): TeamData | null;
    teamsLength(): number;
    robotTypeMetadata(index: number, obj?: RobotTypeMetadata): RobotTypeMetadata | null;
    robotTypeMetadataLength(): number;
    constants(obj?: GameplayConstants): GameplayConstants | null;
    static startGameHeader(builder: flatbuffers.Builder): void;
    static addSpecVersion(builder: flatbuffers.Builder, specVersionOffset: flatbuffers.Offset): void;
    static addTeams(builder: flatbuffers.Builder, teamsOffset: flatbuffers.Offset): void;
    static createTeamsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startTeamsVector(builder: flatbuffers.Builder, numElems: number): void;
    static addRobotTypeMetadata(builder: flatbuffers.Builder, robotTypeMetadataOffset: flatbuffers.Offset): void;
    static createRobotTypeMetadataVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startRobotTypeMetadataVector(builder: flatbuffers.Builder, numElems: number): void;
    static addConstants(builder: flatbuffers.Builder, constantsOffset: flatbuffers.Offset): void;
    static endGameHeader(builder: flatbuffers.Builder): flatbuffers.Offset;
}
