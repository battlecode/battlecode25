package battlecode.common;

public enum RobotOrTowerType {
    SOLDIER(50, 0, 0),
    MOPPER(50, 0, 0),
    PAINT_TOWER(100, 100, 0),
    MONEY_TOWER(100, 0, 100);

    public final int paintCapacity;

    // how much paint the unit generates per turn
    public final int paintPerTurn;

    // how much money the unit generates per turn
    public final int moneyPerTurn;
    // TODO not implemented (values are fake)

    RobotOrTowerType(int paintCapacity, int paintPerTurn, int moneyPerTurn) {
        this.paintCapacity = paintCapacity;
        this.paintPerTurn = paintPerTurn;
        this.moneyPerTurn = moneyPerTurn;
    }
}
