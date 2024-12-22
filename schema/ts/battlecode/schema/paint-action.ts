// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

/**
 * Visually indicate a tile has been painted
 */
export class PaintAction {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):PaintAction {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

loc():number {
  return this.bb!.readUint16(this.bb_pos);
}

isSecondary():number {
  return this.bb!.readInt8(this.bb_pos + 2);
}

static sizeOf():number {
  return 4;
}

static createPaintAction(builder:flatbuffers.Builder, loc: number, isSecondary: number):flatbuffers.Offset {
  builder.prep(2, 4);
  builder.pad(1);
  builder.writeInt8(isSecondary);
  builder.writeInt16(loc);
  return builder.offset();
}

}
