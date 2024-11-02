package battlecode.common;

public enum UnitType {
    SOLDIER(100, 250, 5, 250, -1, 200, 10, 20, 20, -1, 0, 0),
    SPLASHER(150, 400, 50, 150, -1, 300, 50, 9, -1, 50, 0, 0),
    MOPPER(50, 300, 0, 50, -1, 100, 30, 2, -1, -1, 0, 0),
    
    LEVEL_ONE_PAINT_TOWER(0, 25,  0, 1000, 1, 1000, 10, 9, 20, 10, 5, 0),
    LEVEL_TWO_PAINT_TOWER(0, 100, 0, 1500, 2, 1000, 10, 9, 20, 10, 10, 0),
    LEVEL_THREE_PAINT_TOWER(0, 100, 0, 2000, 3, 1000, 10, 9, 20, 10, 15, 0),

    LEVEL_ONE_MONEY_TOWER(0, 25,  0, 1000, 1, 1000, 10, 9, 20, 10, 0, 10),
    LEVEL_TWO_MONEY_TOWER(0, 100,  0, 1500, 2, 1000, 10, 9, 20, 10, 0, 15),
    LEVEL_THREE_MONEY_TOWER(0, 100, 0, 2000, 3, 1000, 10, 9, 20, 10, 0, 20),

    LEVEL_ONE_DEFENSE_TOWER(0, 25,  0, 2500, 1, 1000, 10, 25, 60, 30, 0, 0),
    LEVEL_TWO_DEFENSE_TOWER(0, 50,  0, 3000, 2, 1000, 10, 25, 65, 35, 0, 0),
    LEVEL_THREE_DEFENSE_TOWER(0, 50, 0, 3500, 3, 1000, 10, 25, 70, 40, 0, 0);


    // the paint cost to build the unit
    public final int paintCost;

    // the money cost to build the unit
    public final int moneyCost;

    // the paint cost of the unit's attack
    public final int attackCost;

    // how much health the unit has
    public final int health;

    // the unit's level
    public final int level;

    // the max amount of paint the unit can stash
    public final int paintCapacity;

    // the number of turns before the unit can act again
    public final int actionCooldown;

    // the radius within which the unit can act
    public final int actionRadiusSquared;

    // the strength of the unit's attack
    public final int attackStrength;

    // the strength of the unit's AOE attack
    public final int aoeAttackStrength;

    // how much paint the unit generates per turn
    public final int paintPerTurn;

    // how much money the unit generates per turn
    public final int moneyPerTurn;

    public static boolean isRobotType(UnitType type){
        return type == SOLDIER || type == SPLASHER || type == MOPPER;
    }

    public static boolean isTowerType(UnitType type){
        return !isRobotType(type);
    }

    public static boolean canUpgradeType(UnitType type){
        return (type.level == 1 || type.level == 2) && isTowerType(type);
    }

    public static UnitType getNextLevel(UnitType type){
        switch (type){
            case LEVEL_ONE_DEFENSE_TOWER: return LEVEL_TWO_DEFENSE_TOWER;
            case LEVEL_TWO_DEFENSE_TOWER: return LEVEL_THREE_DEFENSE_TOWER;
            case LEVEL_ONE_MONEY_TOWER: return LEVEL_TWO_MONEY_TOWER;
            case LEVEL_TWO_MONEY_TOWER: return LEVEL_THREE_MONEY_TOWER;
            case LEVEL_ONE_PAINT_TOWER: return LEVEL_TWO_PAINT_TOWER;
            case LEVEL_TWO_PAINT_TOWER: return LEVEL_THREE_PAINT_TOWER;
            default: return null;
        }
    }

    UnitType(int paintCost, int moneyCost, int attackCost, int health, int level, int paintCapacity, int actionCooldown, int actionRadiusSquared, int attackStrength, int aoeAttackStrength, int paintPerTurn, int moneyPerTurn) {
        this.paintCost = paintCost;
        this.moneyCost = moneyCost;
        this.attackCost = attackCost;
        this.health = health;
        this.level = level;
        this.paintCapacity = paintCapacity;
        this.actionCooldown = actionCooldown;
        this.actionRadiusSquared = actionRadiusSquared;
        this.attackStrength = attackStrength;
        this.aoeAttackStrength = aoeAttackStrength;
        this.paintPerTurn = paintPerTurn;
        this.moneyPerTurn = moneyPerTurn;
    }
}
