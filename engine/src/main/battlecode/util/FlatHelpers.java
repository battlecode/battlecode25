package battlecode.util;

import battlecode.common.UnitType;
import battlecode.schema.VecTable;
import battlecode.schema.WinType;
import battlecode.world.DominationFactor;
import battlecode.schema.Action;
import com.google.flatbuffers.FlatBufferBuilder;
import gnu.trove.TByteCollection;
import gnu.trove.list.TByteList;
import gnu.trove.list.TFloatList;
import gnu.trove.list.TIntList;
import gnu.trove.list.TCharList;
import gnu.trove.list.array.TByteArrayList;

import java.util.List;
import java.util.function.ObjIntConsumer;

/**
 * Misc. helper functions for working with flatbuffers.
 *
 * @author james
 */
public class FlatHelpers {

    //assumes all robots are level 1 (can change levels manually if needed)
    public static UnitType getUnitTypeFromRobotType(byte b){
        switch (b){
            case 1:
                return UnitType.LEVEL_ONE_PAINT_TOWER;
            case 2:
                return UnitType.LEVEL_ONE_MONEY_TOWER;
            case 3:
                return UnitType.LEVEL_ONE_DEFENSE_TOWER;
            case 4:
                return UnitType.SOLDIER;
            case 5:
                return UnitType.SPLASHER;
            case 6:
                return UnitType.MOPPER;
            default:
                throw new RuntimeException("No unit type for " + b);
        }
    }

    public static byte getRobotTypeFromUnitType(UnitType type){
        switch(type) {
            case LEVEL_ONE_PAINT_TOWER:
                return 1;
            case LEVEL_TWO_PAINT_TOWER:
                return 1;
            case LEVEL_THREE_PAINT_TOWER:
                return 1;
            case LEVEL_ONE_MONEY_TOWER:
                return 2;
            case LEVEL_TWO_MONEY_TOWER:
                return 2;
            case LEVEL_THREE_MONEY_TOWER:
                return 2;
            case LEVEL_ONE_DEFENSE_TOWER:
                return 3;
            case LEVEL_TWO_DEFENSE_TOWER:
                return 3;
            case LEVEL_THREE_DEFENSE_TOWER:
                return 3;
            case SOLDIER:
                return 4;
            case SPLASHER:
                return 5;
            case MOPPER:
                return 6;
            default:
                throw new RuntimeException("Cannot find byte encoding for " + type);
        }
    }

    public static byte getWinTypeFromDominationFactor(DominationFactor factor) {
        switch (factor) {
            case PAINT_ENOUGH_AREA:
                return WinType.MAJORITY_PAINTED;
            case DESTROY_ALL_UNITS:
                return WinType.ALL_UNITS_DESTROYED;
            case MORE_SQUARES_PAINTED:
                return WinType.AREA_PAINTED;
            case MORE_TOWERS_ALIVE:
                return WinType.MORE_TOWERS;
            case MORE_MONEY:
                return WinType.MORE_MONEY;
            case MORE_PAINT_IN_UNITS:
                return WinType.MORE_STORED_PAINT;
            case MORE_ROBOTS_ALIVE:
                return WinType.MORE_ROBOTS;
            case WON_BY_DUBIOUS_REASONS:
                return WinType.COIN_FLIP;
            case RESIGNATION:
                return WinType.RESIGNATION;
            default:
                return Byte.MIN_VALUE;
        }
    }

    /**
     * DO NOT CALL THIS WITH OFFSETS!
     * Only call it when you're adding an actual int[] to a buffer,
     * not a Table[].
     * For that, call offsetVector.
     *
     * Well that's a weird API.
     *
     * Call like so:
     * int xyzP = intVector(builder, xyz, BufferType::startXyzVector);
     */
    // public static int intVector(FlatBufferBuilder builder,
    // TIntList arr,
    // ObjIntConsumer<FlatBufferBuilder> start) {
    // final int length = arr.size();
    // start.accept(builder, length);

    // // arrays go backwards in flatbuffers
    // // for reasons
    // for (int i = length - 1; i >= 0; i--) {
    // builder.addInt(arr.get(i));
    // }
    // return builder.endVector();
    // }

    /**
     * This is DIFFERENT from intVector!
     *
     * Call this when you're adding a table of offsets, not flat ints.
     */
    // public static int offsetVector(FlatBufferBuilder builder,
    // TIntList arr,
    // ObjIntConsumer<FlatBufferBuilder> start) {
    // final int length = arr.size();
    // start.accept(builder, length);

    // // arrays go backwards in flatbuffers
    // // for reasons
    // for (int i = length - 1; i >= 0; i--) {
    // builder.addOffset(arr.get(i));
    // }
    // return builder.endVector();
    // }

    // public static int floatVector(FlatBufferBuilder builder,
    // TFloatList arr,
    // ObjIntConsumer<FlatBufferBuilder> start) {
    // final int length = arr.size();
    // start.accept(builder, length);

    // for (int i = length - 1; i >= 0; i--) {
    // builder.addFloat(arr.get(i));
    // }
    // return builder.endVector();
    // }

    // public static int byteVector(FlatBufferBuilder builder,
    // TByteList arr,
    // ObjIntConsumer<FlatBufferBuilder> start) {
    // final int length = arr.size();
    // start.accept(builder, length);

    // for (int i = length - 1; i >= 0; i--) {
    // builder.addByte(arr.get(i));
    // }
    // return builder.endVector();
    // }

    // public static int charVector(FlatBufferBuilder builder,
    // TCharList arr,
    // ObjIntConsumer<FlatBufferBuilder> start) {
    // final int length = arr.size();
    // start.accept(builder, length);

    // for (int i = length - 1; i >= 0; i--) {
    // builder.addInt(arr.get(i));
    // }
    // return builder.endVector();
    // }

    public static int createVecTable(FlatBufferBuilder builder, TIntList xs, TIntList ys) {
        if (xs.size() != ys.size()) {
            throw new RuntimeException("Mismatched x/y length: " + xs.size() + " != " + ys.size());
        }
        // int xsP = intVector(builder, xs, VecTable::startXsVector);
        // int ysP = intVector(builder, ys, VecTable::startYsVector);
        int xsP = VecTable.createXsVector(builder, xs.toArray());
        int ysP = VecTable.createYsVector(builder, ys.toArray());
        return VecTable.createVecTable(builder, xsP, ysP);
    }

    public static int RGBtoInt(int red, int green, int blue){
        return (red << 16) + (green << 8) + blue;
    }
}
