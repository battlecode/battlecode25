from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class Action(object):
  NONE: int
  DamageAction: int
  PaintAction: int
  UnpaintAction: int
  AttackAction: int
  MopAction: int
  BuildAction: int
  TransferAction: int
  MessageAction: int
  SpawnAction: int
  DieAction: int
  UpgradeAction: int
  IndicatorStringAction: int
  IndicatorDotAction: int
  IndicatorLineAction: int

