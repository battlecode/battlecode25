# automatically generated by the FlatBuffers compiler, do not modify

# namespace: schema

import flatbuffers
from flatbuffers.compat import import_numpy
from typing import Any
from ..schema.ProfilerEvent import ProfilerEvent
from typing import Optional
np = import_numpy()

# A profile contains all events and is labeled with a name.
class ProfilerProfile(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAs(cls, buf, offset: int = 0):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = ProfilerProfile()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def GetRootAsProfilerProfile(cls, buf, offset=0):
        """This method is deprecated. Please switch to GetRootAs."""
        return cls.GetRootAs(buf, offset)
    # ProfilerProfile
    def Init(self, buf: bytes, pos: int):
        self._tab = flatbuffers.table.Table(buf, pos)

    # The display-friendly name of the profile.
    # ProfilerProfile
    def Name(self) -> Optional[str]:
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # The events that occurred in the profile.
    # ProfilerProfile
    def Events(self, j: int) -> Optional[ProfilerEvent]:
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = ProfilerEvent()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # ProfilerProfile
    def EventsLength(self) -> int:
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # ProfilerProfile
    def EventsIsNone(self) -> bool:
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        return o == 0

def ProfilerProfileStart(builder: flatbuffers.Builder):
    builder.StartObject(2)

def Start(builder: flatbuffers.Builder):
    ProfilerProfileStart(builder)

def ProfilerProfileAddName(builder: flatbuffers.Builder, name: int):
    builder.PrependUOffsetTRelativeSlot(0, flatbuffers.number_types.UOffsetTFlags.py_type(name), 0)

def AddName(builder: flatbuffers.Builder, name: int):
    ProfilerProfileAddName(builder, name)

def ProfilerProfileAddEvents(builder: flatbuffers.Builder, events: int):
    builder.PrependUOffsetTRelativeSlot(1, flatbuffers.number_types.UOffsetTFlags.py_type(events), 0)

def AddEvents(builder: flatbuffers.Builder, events: int):
    ProfilerProfileAddEvents(builder, events)

def ProfilerProfileStartEventsVector(builder, numElems: int) -> int:
    return builder.StartVector(4, numElems, 4)

def StartEventsVector(builder, numElems: int) -> int:
    return ProfilerProfileStartEventsVector(builder, numElems)

def ProfilerProfileEnd(builder: flatbuffers.Builder) -> int:
    return builder.EndObject()

def End(builder: flatbuffers.Builder) -> int:
    return ProfilerProfileEnd(builder)
