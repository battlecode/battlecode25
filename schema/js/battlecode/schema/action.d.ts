import { AttackAction } from '../../battlecode/schema/attack-action';
import { BuildAction } from '../../battlecode/schema/build-action';
import { DamageAction } from '../../battlecode/schema/damage-action';
import { DieAction } from '../../battlecode/schema/die-action';
import { IndicatorDotAction } from '../../battlecode/schema/indicator-dot-action';
import { IndicatorLineAction } from '../../battlecode/schema/indicator-line-action';
import { IndicatorStringAction } from '../../battlecode/schema/indicator-string-action';
import { MarkAction } from '../../battlecode/schema/mark-action';
import { MessageAction } from '../../battlecode/schema/message-action';
import { MopAction } from '../../battlecode/schema/mop-action';
import { PaintAction } from '../../battlecode/schema/paint-action';
import { SpawnAction } from '../../battlecode/schema/spawn-action';
import { TransferAction } from '../../battlecode/schema/transfer-action';
import { UnmarkAction } from '../../battlecode/schema/unmark-action';
import { UnpaintAction } from '../../battlecode/schema/unpaint-action';
import { UpgradeAction } from '../../battlecode/schema/upgrade-action';
export declare enum Action {
    NONE = 0,
    DamageAction = 1,
    PaintAction = 2,
    UnpaintAction = 3,
    MarkAction = 4,
    UnmarkAction = 5,
    AttackAction = 6,
    MopAction = 7,
    BuildAction = 8,
    TransferAction = 9,
    MessageAction = 10,
    SpawnAction = 11,
    DieAction = 12,
    UpgradeAction = 13,
    IndicatorStringAction = 14,
    IndicatorDotAction = 15,
    IndicatorLineAction = 16
}
export declare function unionToAction(type: Action, accessor: (obj: AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null): AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null;
export declare function unionListToAction(type: Action, accessor: (index: number, obj: AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null, index: number): AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null;
