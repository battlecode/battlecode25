import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate that a tower was upgraded
 */
export declare class UpgradeAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): UpgradeAction;
    /**
     * Id of the upgraded tower
     */
    id(): number;
    static sizeOf(): number;
    static createUpgradeAction(builder: flatbuffers.Builder, id: number): flatbuffers.Offset;
}
