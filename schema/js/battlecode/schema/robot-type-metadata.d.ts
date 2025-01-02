import * as flatbuffers from 'flatbuffers';
import { RobotType } from '../../battlecode/schema/robot-type';
export declare class RobotTypeMetadata {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): RobotTypeMetadata;
    static getRootAsRobotTypeMetadata(bb: flatbuffers.ByteBuffer, obj?: RobotTypeMetadata): RobotTypeMetadata;
    static getSizePrefixedRootAsRobotTypeMetadata(bb: flatbuffers.ByteBuffer, obj?: RobotTypeMetadata): RobotTypeMetadata;
    type(): RobotType;
    actionCooldown(): number;
    movementCooldown(): number;
    baseHealth(): number;
    basePaint(): number;
    actionRadiusSquared(): number;
    visionRadiusSquared(): number;
    bytecodeLimit(): number;
    static startRobotTypeMetadata(builder: flatbuffers.Builder): void;
    static addType(builder: flatbuffers.Builder, type: RobotType): void;
    static addActionCooldown(builder: flatbuffers.Builder, actionCooldown: number): void;
    static addMovementCooldown(builder: flatbuffers.Builder, movementCooldown: number): void;
    static addBaseHealth(builder: flatbuffers.Builder, baseHealth: number): void;
    static addBasePaint(builder: flatbuffers.Builder, basePaint: number): void;
    static addActionRadiusSquared(builder: flatbuffers.Builder, actionRadiusSquared: number): void;
    static addVisionRadiusSquared(builder: flatbuffers.Builder, visionRadiusSquared: number): void;
    static addBytecodeLimit(builder: flatbuffers.Builder, bytecodeLimit: number): void;
    static endRobotTypeMetadata(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createRobotTypeMetadata(builder: flatbuffers.Builder, type: RobotType, actionCooldown: number, movementCooldown: number, baseHealth: number, basePaint: number, actionRadiusSquared: number, visionRadiusSquared: number, bytecodeLimit: number): flatbuffers.Offset;
}
