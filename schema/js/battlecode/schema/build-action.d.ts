import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a tower being built
 */
export declare class BuildAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BuildAction;
    /**
     * Id of the tower bot
     */
    id(): number;
    static sizeOf(): number;
    static createBuildAction(builder: flatbuffers.Builder, id: number): flatbuffers.Offset;
}
