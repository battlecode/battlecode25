package battlecode.common;

public enum RobotOrTowerType {
    SOLDIER(200),
    SPLASHER(300),
    MOPPER(100);

    public final int paintCapacity;
    public final int attackPaintCost;
    public final int attackDamage;
    // TODO not implemented

    RobotOrTowerType(int paintCapacity){
        this.paintCapacity = paintCapacity;
    }
}

