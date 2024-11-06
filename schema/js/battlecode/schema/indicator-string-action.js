"use strict";
// automatically generated by the FlatBuffers compiler, do not modify
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorStringAction = void 0;
var flatbuffers = require("flatbuffers");
/**
 * Update the indicator string for this robot
 */
var IndicatorStringAction = /** @class */ (function () {
    function IndicatorStringAction() {
        this.bb = null;
        this.bb_pos = 0;
    }
    IndicatorStringAction.prototype.__init = function (i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    };
    IndicatorStringAction.getRootAsIndicatorStringAction = function (bb, obj) {
        return (obj || new IndicatorStringAction()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    };
    IndicatorStringAction.getSizePrefixedRootAsIndicatorStringAction = function (bb, obj) {
        bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
        return (obj || new IndicatorStringAction()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
    };
    IndicatorStringAction.prototype.value = function (optionalEncoding) {
        var offset = this.bb.__offset(this.bb_pos, 4);
        return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
    };
    IndicatorStringAction.startIndicatorStringAction = function (builder) {
        builder.startObject(1);
    };
    IndicatorStringAction.addValue = function (builder, valueOffset) {
        builder.addFieldOffset(0, valueOffset, 0);
    };
    IndicatorStringAction.endIndicatorStringAction = function (builder) {
        var offset = builder.endObject();
        return offset;
    };
    IndicatorStringAction.createIndicatorStringAction = function (builder, valueOffset) {
        IndicatorStringAction.startIndicatorStringAction(builder);
        IndicatorStringAction.addValue(builder, valueOffset);
        return IndicatorStringAction.endIndicatorStringAction(builder);
    };
    return IndicatorStringAction;
}());
exports.IndicatorStringAction = IndicatorStringAction;
