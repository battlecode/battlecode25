from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class IndicatorLineAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def StartLoc(self) -> int: ...
  def EndLoc(self) -> int: ...
  def ColorHex(self) -> int: ...

def CreateIndicatorLineAction(builder: flatbuffers.Builder, startLoc: int, endLoc: int, colorHex: int) -> uoffset: ...

