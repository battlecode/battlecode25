from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class Vec(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def X(self) -> int: ...
  def Y(self) -> int: ...

def CreateVec(builder: flatbuffers.Builder, x: int, y: int) -> uoffset: ...

