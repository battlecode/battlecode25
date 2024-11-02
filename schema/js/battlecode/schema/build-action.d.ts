import * as flatbuffers from 'flatbuffers';
export declare class BuildAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): BuildAction;
    id(): number;
    static sizeOf(): number;
    static createBuildAction(builder: flatbuffers.Builder, id: number): flatbuffers.Offset;
}
