import * as flatbuffers from 'flatbuffers';
import { RobotType } from '../../battlecode/schema/robot-type';
export declare class SpawnAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): SpawnAction;
    x(): number;
    y(): number;
    team(): number;
    robotType(): RobotType;
    static sizeOf(): number;
    static createSpawnAction(builder: flatbuffers.Builder, x: number, y: number, team: number, robotType: RobotType): flatbuffers.Offset;
}
