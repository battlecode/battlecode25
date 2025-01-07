from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class MopAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def Id0(self) -> int: ...
  def Id1(self) -> int: ...
  def Id2(self) -> int: ...

def CreateMopAction(builder: flatbuffers.Builder, id0: int, id1: int, id2: int) -> uoffset: ...

