from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class RobotType(object):
  NONE: int
  PAINT_TOWER: int
  MONEY_TOWER: int
  DEFENSE_TOWER: int
  SOLDIER: int
  SPLASHER: int
  MOPPER: int

