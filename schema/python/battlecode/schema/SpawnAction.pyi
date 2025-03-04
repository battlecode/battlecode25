from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing
from ..schema.RobotType import RobotType

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class SpawnAction(object):
  @classmethod
  def SizeOf(cls) -> int: ...

  def Init(self, buf: bytes, pos: int) -> None: ...
  def Id(self) -> int: ...
  def X(self) -> int: ...
  def Y(self) -> int: ...
  def Team(self) -> int: ...
  def RobotType(self) -> typing.Literal[RobotType.NONE, RobotType.PAINT_TOWER, RobotType.MONEY_TOWER, RobotType.DEFENSE_TOWER, RobotType.SOLDIER, RobotType.SPLASHER, RobotType.MOPPER]: ...

def CreateSpawnAction(builder: flatbuffers.Builder, id: int, x: int, y: int, team: int, robotType: typing.Literal[RobotType.NONE, RobotType.PAINT_TOWER, RobotType.MONEY_TOWER, RobotType.DEFENSE_TOWER, RobotType.SOLDIER, RobotType.SPLASHER, RobotType.MOPPER]) -> uoffset: ...

