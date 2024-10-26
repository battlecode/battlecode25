package battlecode.common;

public enum RobotOrTowerType {
    SOLDIER(200, 5, 20, 20, 10),
    SPLASHER(300, 50, 50, 9, 50),
    MOPPER(100, 0, 0, 2, 30);

    public final int paintCapacity;
    public final int attackPaintCost;
    public final int attackDamage;
    public final int attackRadiusSquared;
    public final int attackCooldown;
    // TODO not implemented

    RobotOrTowerType(int paintCapacity, int attackPaintCost, int attackDamage, int attackRadiusSquared, int attackCooldown){
        this.paintCapacity = paintCapacity;
        this.attackPaintCost = attackPaintCost;
        this.attackDamage = attackDamage;
        this.attackRadiusSquared = attackRadiusSquared;
        this.attackCooldown = attackCooldown;
    }
}

