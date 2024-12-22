// automatically generated by the FlatBuffers compiler, do not modify

package battlecode.schema;

import com.google.flatbuffers.BaseVector;
import com.google.flatbuffers.BooleanVector;
import com.google.flatbuffers.ByteVector;
import com.google.flatbuffers.Constants;
import com.google.flatbuffers.DoubleVector;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.flatbuffers.FloatVector;
import com.google.flatbuffers.IntVector;
import com.google.flatbuffers.LongVector;
import com.google.flatbuffers.ShortVector;
import com.google.flatbuffers.StringVector;
import com.google.flatbuffers.Struct;
import com.google.flatbuffers.Table;
import com.google.flatbuffers.UnionVector;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * A profiler file is a collection of profiles.
 * When profiling is enabled there is one of these per team per match.
 */
@SuppressWarnings("unused")
public final class ProfilerFile extends Table {
  public static void ValidateVersion() { Constants.FLATBUFFERS_23_5_26(); }
  public static ProfilerFile getRootAsProfilerFile(ByteBuffer _bb) { return getRootAsProfilerFile(_bb, new ProfilerFile()); }
  public static ProfilerFile getRootAsProfilerFile(ByteBuffer _bb, ProfilerFile obj) { _bb.order(ByteOrder.LITTLE_ENDIAN); return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb)); }
  public void __init(int _i, ByteBuffer _bb) { __reset(_i, _bb); }
  public ProfilerFile __assign(int _i, ByteBuffer _bb) { __init(_i, _bb); return this; }

  /**
   * The method names that are referred to in the events.
   */
  public String frames(int j) { int o = __offset(4); return o != 0 ? __string(__vector(o) + j * 4) : null; }
  public int framesLength() { int o = __offset(4); return o != 0 ? __vector_len(o) : 0; }
  public StringVector framesVector() { return framesVector(new StringVector()); }
  public StringVector framesVector(StringVector obj) { int o = __offset(4); return o != 0 ? obj.__assign(__vector(o), 4, bb) : null; }
  /**
   * The recorded profiles, one per robot.
   */
  public battlecode.schema.ProfilerProfile profiles(int j) { return profiles(new battlecode.schema.ProfilerProfile(), j); }
  public battlecode.schema.ProfilerProfile profiles(battlecode.schema.ProfilerProfile obj, int j) { int o = __offset(6); return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null; }
  public int profilesLength() { int o = __offset(6); return o != 0 ? __vector_len(o) : 0; }
  public battlecode.schema.ProfilerProfile.Vector profilesVector() { return profilesVector(new battlecode.schema.ProfilerProfile.Vector()); }
  public battlecode.schema.ProfilerProfile.Vector profilesVector(battlecode.schema.ProfilerProfile.Vector obj) { int o = __offset(6); return o != 0 ? obj.__assign(__vector(o), 4, bb) : null; }

  public static int createProfilerFile(FlatBufferBuilder builder,
      int framesOffset,
      int profilesOffset) {
    builder.startTable(2);
    ProfilerFile.addProfiles(builder, profilesOffset);
    ProfilerFile.addFrames(builder, framesOffset);
    return ProfilerFile.endProfilerFile(builder);
  }

  public static void startProfilerFile(FlatBufferBuilder builder) { builder.startTable(2); }
  public static void addFrames(FlatBufferBuilder builder, int framesOffset) { builder.addOffset(0, framesOffset, 0); }
  public static int createFramesVector(FlatBufferBuilder builder, int[] data) { builder.startVector(4, data.length, 4); for (int i = data.length - 1; i >= 0; i--) builder.addOffset(data[i]); return builder.endVector(); }
  public static void startFramesVector(FlatBufferBuilder builder, int numElems) { builder.startVector(4, numElems, 4); }
  public static void addProfiles(FlatBufferBuilder builder, int profilesOffset) { builder.addOffset(1, profilesOffset, 0); }
  public static int createProfilesVector(FlatBufferBuilder builder, int[] data) { builder.startVector(4, data.length, 4); for (int i = data.length - 1; i >= 0; i--) builder.addOffset(data[i]); return builder.endVector(); }
  public static void startProfilesVector(FlatBufferBuilder builder, int numElems) { builder.startVector(4, numElems, 4); }
  public static int endProfilerFile(FlatBufferBuilder builder) {
    int o = builder.endTable();
    return o;
  }

  public static final class Vector extends BaseVector {
    public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) { __reset(_vector, _element_size, _bb); return this; }

    public ProfilerFile get(int j) { return get(new ProfilerFile(), j); }
    public ProfilerFile get(ProfilerFile obj, int j) {  return obj.__assign(__indirect(__element(j), bb), bb); }
  }
}

