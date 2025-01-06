import * as flatbuffers from 'flatbuffers';
/**
 * Visually indicate a splash attack
 */
export declare class SplashAction {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): SplashAction;
    /**
     * Location of the splash attack
     */
    loc(): number;
    static sizeOf(): number;
    static createSplashAction(builder: flatbuffers.Builder, loc: number): flatbuffers.Offset;
}
