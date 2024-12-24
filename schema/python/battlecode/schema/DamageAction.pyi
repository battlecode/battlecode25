from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class DamageAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def Id(self) -> int: ...
  def Damage(self) -> int: ...

def CreateDamageAction(builder: flatbuffers.Builder, id: int, damage: int) -> uoffset: ...

