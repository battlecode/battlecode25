package battlecode.common;

public enum UnitType {
    SOLDIER(200, 250, 5, 250, -1, 200, 10, 9, 50, -1, 0, 0, 0),
    SPLASHER(300, 400, 50, 150, -1, 300, 50, 4, -1, 100, 0, 0, 0),
    MOPPER(100, 300, 0, 50, -1, 100, 30, 2, -1, -1, 0, 0, 0),
    
    LEVEL_ONE_PAINT_TOWER(0, 1000,  0, 1000, 1, 1000, 10, 9, 20, 10, 5, 0, 0),
    LEVEL_TWO_PAINT_TOWER(0, 2500, 0, 1500, 2, 1000, 10, 9, 20, 10, 10, 0, 0),
    LEVEL_THREE_PAINT_TOWER(0, 5000, 0, 2000, 3, 1000, 10, 9, 20, 10, 15, 0, 0),

    LEVEL_ONE_MONEY_TOWER(0, 1000,  0, 1000, 1, 1000, 10, 9, 20, 10, 0, 20, 0),
    LEVEL_TWO_MONEY_TOWER(0, 2500,  0, 1500, 2, 1000, 10, 9, 20, 10, 0, 30, 0),
    LEVEL_THREE_MONEY_TOWER(0, 5000, 0, 2000, 3, 1000, 10, 9, 20, 10, 0, 40, 0),

    LEVEL_ONE_DEFENSE_TOWER(0, 1000,  0, 2000, 1, 1000, 10, 16, 40, 20, 0, 0, 20),
    LEVEL_TWO_DEFENSE_TOWER(0, 2500,  0, 2500, 2, 1000, 10, 16, 50, 25, 0, 0, 30),
    LEVEL_THREE_DEFENSE_TOWER(0, 5000, 0, 3000, 3, 1000, 10, 16, 60, 30, 0, 0, 40);


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

    // how much money the unit earns from a successful attack (attack that hits at least one unit)
    public final int attackMoneyBonus;

    public boolean isRobotType(){
        return this == SOLDIER || this == SPLASHER || this == MOPPER;
    }

    public boolean isTowerType(){
        return !this.isRobotType();
    }

    public boolean canUpgradeType(){
        return (this.level == 1 || this.level == 2) && this.isTowerType();
    }

    public UnitType getNextLevel(){
        switch (this){
            case LEVEL_ONE_DEFENSE_TOWER: return LEVEL_TWO_DEFENSE_TOWER;
            case LEVEL_TWO_DEFENSE_TOWER: return LEVEL_THREE_DEFENSE_TOWER;
            case LEVEL_ONE_MONEY_TOWER: return LEVEL_TWO_MONEY_TOWER;
            case LEVEL_TWO_MONEY_TOWER: return LEVEL_THREE_MONEY_TOWER;
            case LEVEL_ONE_PAINT_TOWER: return LEVEL_TWO_PAINT_TOWER;
            case LEVEL_TWO_PAINT_TOWER: return LEVEL_THREE_PAINT_TOWER;
            default: return null;
        }
    }

    public UnitType getBaseType(){
        switch (this){
            case LEVEL_TWO_DEFENSE_TOWER: return LEVEL_ONE_DEFENSE_TOWER;
            case LEVEL_THREE_DEFENSE_TOWER: return LEVEL_ONE_DEFENSE_TOWER;
            case LEVEL_TWO_PAINT_TOWER: return LEVEL_ONE_PAINT_TOWER;
            case LEVEL_THREE_PAINT_TOWER: return LEVEL_ONE_PAINT_TOWER;
            case LEVEL_TWO_MONEY_TOWER: return LEVEL_ONE_MONEY_TOWER;
            case LEVEL_THREE_MONEY_TOWER: return LEVEL_ONE_MONEY_TOWER;
            default: return this;
        }
    }

    UnitType(int paintCost, int moneyCost, int attackCost, int health, int level, int paintCapacity, int actionCooldown, int actionRadiusSquared, int attackStrength, int aoeAttackStrength, int paintPerTurn, int moneyPerTurn, int attackMoneyBonus) {
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
        this.attackMoneyBonus = attackMoneyBonus;
    }
}
