import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate an attack
 */
export declare class AttackAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): AttackAction;
    id(): number;
    static sizeOf(): number;
    static createAttackAction(builder: flatbuffers.Builder, id: number): flatbuffers.Offset;
}
