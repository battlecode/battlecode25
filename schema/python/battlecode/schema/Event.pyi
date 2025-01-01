from __future__ import annotations

import flatbuffers
import numpy as np

import flatbuffers
import typing

uoffset: typing.TypeAlias = flatbuffers.number_types.UOffsetTFlags.py_type

class Event(object):
  NONE: int
  GameHeader: int
  MatchHeader: int
  Round: int
  MatchFooter: int
  GameFooter: int

