import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate transferring paint from one robot to another
 */
export declare class TransferAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): TransferAction;
    /**
     * Id of the transfer target
     */
    id(): number;
    amount(): number;
    static sizeOf(): number;
    static createTransferAction(builder: flatbuffers.Builder, id: number, amount: number): flatbuffers.Offset;
}
