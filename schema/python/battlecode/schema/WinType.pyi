from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class WinType(object):
  RESIGNATION: int
  MAJORITY_PAINTED: int
  ALL_UNITS_DESTROYED: int
  AREA_PAINTED: int
  MORE_TOWERS: int
  MORE_MONEY: int
  MORE_STORED_PAINT: int
  MORE_ROBOTS: int
  COIN_FLIP: int

