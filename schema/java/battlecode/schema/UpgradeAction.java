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
 * Visually indicate that a tower was upgraded
 */
@SuppressWarnings("unused")
public final class UpgradeAction extends Struct {
  public void __init(int _i, ByteBuffer _bb) { __reset(_i, _bb); }
  public UpgradeAction __assign(int _i, ByteBuffer _bb) { __init(_i, _bb); return this; }

  /**
   * Id of the upgraded tower
   */
  public int id() { return bb.getShort(bb_pos + 0) & 0xFFFF; }

  public static int createUpgradeAction(FlatBufferBuilder builder, int id) {
    builder.prep(2, 2);
    builder.putShort((short) id);
    return builder.offset();
  }

  public static final class Vector extends BaseVector {
    public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) { __reset(_vector, _element_size, _bb); return this; }

    public UpgradeAction get(int j) { return get(new UpgradeAction(), j); }
    public UpgradeAction get(UpgradeAction obj, int j) {  return obj.__assign(__element(j), bb); }
  }
}

