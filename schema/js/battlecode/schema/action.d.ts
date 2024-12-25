import { AttackAction } from '../../battlecode/schema/attack-action';
import { BuildAction } from '../../battlecode/schema/build-action';
import { DamageAction } from '../../battlecode/schema/damage-action';
import { DieExceptionAction } from '../../battlecode/schema/die-exception-action';
import { IndicatorDotAction } from '../../battlecode/schema/indicator-dot-action';
import { IndicatorLineAction } from '../../battlecode/schema/indicator-line-action';
import { IndicatorStringAction } from '../../battlecode/schema/indicator-string-action';
import { MessageAction } from '../../battlecode/schema/message-action';
import { MopAction } from '../../battlecode/schema/mop-action';
import { PaintAction } from '../../battlecode/schema/paint-action';
import { SpawnAction } from '../../battlecode/schema/spawn-action';
import { TransferAction } from '../../battlecode/schema/transfer-action';
import { UnpaintAction } from '../../battlecode/schema/unpaint-action';
import { UpgradeAction } from '../../battlecode/schema/upgrade-action';
export declare enum Action {
    NONE = 0,
    DamageAction = 1,
    PaintAction = 2,
    UnpaintAction = 3,
    AttackAction = 4,
    MopAction = 5,
    BuildAction = 6,
    TransferAction = 7,
    MessageAction = 8,
    SpawnAction = 9,
    UpgradeAction = 10,
    DieExceptionAction = 11,
    IndicatorStringAction = 12,
    IndicatorDotAction = 13,
    IndicatorLineAction = 14
}
export declare function unionToAction(type: Action, accessor: (obj: AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction | null): AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction | null;
export declare function unionListToAction(type: Action, accessor: (index: number, obj: AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction | null, index: number): AttackAction | BuildAction | DamageAction | DieExceptionAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnpaintAction | UpgradeAction | null;
