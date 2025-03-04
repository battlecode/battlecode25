"use strict";
// automatically generated by the FlatBuffers compiler, do not modify
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackAction = void 0;
/**
 * Visually indicate an attack
 */
var AttackAction = /** @class */ (function () {
    function AttackAction() {
        this.bb = null;
        this.bb_pos = 0;
    }
    AttackAction.prototype.__init = function (i, bb) {
        this.bb_pos = i;
        this.bb = bb;
        return this;
    };
    /**
     * Id of the attack target
     */
    AttackAction.prototype.id = function () {
        return this.bb.readUint16(this.bb_pos);
    };
    AttackAction.sizeOf = function () {
        return 2;
    };
    AttackAction.createAttackAction = function (builder, id) {
        builder.prep(2, 2);
        builder.writeInt16(id);
        return builder.offset();
    };
    return AttackAction;
}());
exports.AttackAction = AttackAction;
