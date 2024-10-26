package battlecode.common;

public enum RobotOrTowerType {
    SOLDIER(200, 5, 20),
    SPLASHER(300, 50, 50),
    MOPPER(100, 0, 0);

    public final int paintCapacity;
    public final int attackPaintCost;
    public final int attackDamage;
    // TODO not implemented

    RobotOrTowerType(int paintCapacity, int attackPaintCost, int attackDamage){
        this.paintCapacity = paintCapacity;
        this.attackPaintCost = attackPaintCost;
        this.attackDamage = attackDamage;
    }
}

