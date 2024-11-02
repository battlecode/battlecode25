import * as flatbuffers from 'flatbuffers';
export declare class TransferAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TransferAction;
    id(): number;
    static sizeOf(): number;
    static createTransferAction(builder: flatbuffers.Builder, id: number): flatbuffers.Offset;
}
