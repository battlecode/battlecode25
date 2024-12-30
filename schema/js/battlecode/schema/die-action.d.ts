import * as flatbuffers from 'flatbuffers';
import { DieType } from '../../battlecode/schema/die-type';
/**
 * Indicates that a robot died and should be removed
 */
export declare class DieAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DieAction;
    /**
     * Id of the robot that died
     */
    id(): number;
    dieType(): DieType;
    static sizeOf(): number;
    static createDieAction(builder: flatbuffers.Builder, id: number, dieType: DieType): flatbuffers.Offset;
}
