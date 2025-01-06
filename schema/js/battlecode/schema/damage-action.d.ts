import * as flatbuffers from 'flatbuffers';
/**
 * Generic action representing damage to a robot
 */
export declare class DamageAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): DamageAction;
    /**
     * Id of the damage target
     */
    id(): number;
    damage(): number;
    static sizeOf(): number;
    static createDamageAction(builder: flatbuffers.Builder, id: number, damage: number): flatbuffers.Offset;
}
