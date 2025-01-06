import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate messaging from one robot to another
 */
export declare class MessageAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): MessageAction;
    /**
     * Id of the message target
     */
    id(): number;
    data(): number;
    static sizeOf(): number;
    static createMessageAction(builder: flatbuffers.Builder, id: number, data: number): flatbuffers.Offset;
}
