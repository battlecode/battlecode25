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
import { SplashAction } from '../../battlecode/schema/splash-action';
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
    SplashAction = 7,
    MopAction = 8,
    BuildAction = 9,
    TransferAction = 10,
    MessageAction = 11,
    SpawnAction = 12,
    DieAction = 13,
    UpgradeAction = 14,
    IndicatorStringAction = 15,
    IndicatorDotAction = 16,
    IndicatorLineAction = 17
}
export declare function unionToAction(type: Action, accessor: (obj: AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null): AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null;
export declare function unionListToAction(type: Action, accessor: (index: number, obj: AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction) => AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null, index: number): AttackAction | BuildAction | DamageAction | DieAction | IndicatorDotAction | IndicatorLineAction | IndicatorStringAction | MarkAction | MessageAction | MopAction | PaintAction | SpawnAction | SplashAction | TransferAction | UnmarkAction | UnpaintAction | UpgradeAction | null;
