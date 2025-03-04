from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class IndicatorDotAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def Loc(self) -> int: ...
  def ColorHex(self) -> int: ...

def CreateIndicatorDotAction(builder: flatbuffers.Builder, loc: int, colorHex: int) -> uoffset: ...

