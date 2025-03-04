from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class GameFooter(object):
  @classmethod
  def GetRootAs(cls, buf: bytes, offset: int) -> GameFooter: ...
  @classmethod
  def GetRootAsGameFooter(cls, buf: bytes, offset: int) -> GameFooter: ...
  def Init(self, buf: bytes, pos: int) -> None: ...
  def Winner(self) -> int: ...
def GameFooterStart(builder: flatbuffers.Builder) -> None: ...
def Start(builder: flatbuffers.Builder) -> None: ...
def GameFooterAddWinner(builder: flatbuffers.Builder, winner: int) -> None: ...
def GameFooterEnd(builder: flatbuffers.Builder) -> uoffset: ...
def End(builder: flatbuffers.Builder) -> uoffset: ...

