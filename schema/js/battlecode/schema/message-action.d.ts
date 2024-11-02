import * as flatbuffers from 'flatbuffers';
export declare class MessageAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MessageAction;
    id(): number;
    data(): number;
    static sizeOf(): number;
    static createMessageAction(builder: flatbuffers.Builder, id: number, data: number): flatbuffers.Offset;
}
