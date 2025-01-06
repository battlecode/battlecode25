from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing
from ..schema.DieType import DieType

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class DieAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def Id(self) -> int: ...
  def DieType(self) -> typing.Literal[DieType.UNKNOWN, DieType.EXCEPTION]: ...

def CreateDieAction(builder: flatbuffers.Builder, id: int, dieType: typing.Literal[DieType.UNKNOWN, DieType.EXCEPTION]) -> uoffset: ...

