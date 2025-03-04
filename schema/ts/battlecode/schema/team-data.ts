// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

export class TeamData {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):TeamData {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsTeamData(bb:flatbuffers.ByteBuffer, obj?:TeamData):TeamData {
  return (obj || new TeamData()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsTeamData(bb:flatbuffers.ByteBuffer, obj?:TeamData):TeamData {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new TeamData()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

name():string|null
name(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
name(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

packageName():string|null
packageName(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
packageName(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

teamId():number {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : 0;
}

static startTeamData(builder:flatbuffers.Builder) {
  builder.startObject(3);
}

static addName(builder:flatbuffers.Builder, nameOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, nameOffset, 0);
}

static addPackageName(builder:flatbuffers.Builder, packageNameOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, packageNameOffset, 0);
}

static addTeamId(builder:flatbuffers.Builder, teamId:number) {
  builder.addFieldInt8(2, teamId, 0);
}

static endTeamData(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createTeamData(builder:flatbuffers.Builder, nameOffset:flatbuffers.Offset, packageNameOffset:flatbuffers.Offset, teamId:number):flatbuffers.Offset {
  TeamData.startTeamData(builder);
  TeamData.addName(builder, nameOffset);
  TeamData.addPackageName(builder, packageNameOffset);
  TeamData.addTeamId(builder, teamId);
  return TeamData.endTeamData(builder);
}
}
