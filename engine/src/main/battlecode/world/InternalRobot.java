package battlecode.world;

import battlecode.common.*;
import battlecode.schema.Action;

import java.util.ArrayList;

import org.apache.commons.lang3.NotImplementedException;

/**
 * The representation of a robot used by the server.
 * Comparable ordering:
 * - tiebreak by creation time (priority to later creation)
 * - tiebreak by robot ID (priority to lower ID)
 */
public strictfp class InternalRobot implements Comparable<InternalRobot> {

    private final RobotControllerImpl controller;
    protected final GameWorld gameWorld;

    private int buildExp;
    private int healExp;
    private int attackExp;
    private int paintAmount;

    private final int ID;
    private Team team;
    private MapLocation location;
    private MapLocation diedLocation;
    private int health;
    private boolean spawned;

    private long controlBits;
    private int currentBytecodeLimit;
    private int bytecodesUsed;

    private int roundsAlive;
    private int actionCooldownTurns;
    private int movementCooldownTurns;
    private int spawnCooldownTurns;

    private Flag flag;
    private ArrayList<Trap> trapsToTrigger;
    private ArrayList<Boolean> enteredTraps;

    /**
     * Used to avoid recreating the same RobotInfo object over and over.
     */
    private RobotInfo cachedRobotInfo;

    private String indicatorString;

    /**
     * Create a new internal representation of a robot
     *
     * @param gw   the world the robot exists in
     * @param type the type of the robot
     * @param loc  the location of the robot
     * @param team the team of the robot
     */
    public InternalRobot(GameWorld gw, int id, Team team) {
        this.gameWorld = gw;

        this.ID = id;
        this.team = team;

        this.location = null;
        this.diedLocation = null;
        this.health = GameConstants.DEFAULT_HEALTH;
        this.spawned = false;
        this.trapsToTrigger = new ArrayList<>();
        this.enteredTraps = new ArrayList<>();

        this.buildExp = 0;
        this.healExp = 0;
        this.attackExp = 0;
        this.paintAmount = 0;

        this.controlBits = 0;
        this.currentBytecodeLimit = GameConstants.BYTECODE_LIMIT;
        this.bytecodesUsed = 0;

        this.roundsAlive = 0;
        this.actionCooldownTurns = GameConstants.COOLDOWN_LIMIT;
        this.movementCooldownTurns = GameConstants.COOLDOWN_LIMIT;
        this.spawnCooldownTurns = 0;

        this.indicatorString = "";

        this.controller = new RobotControllerImpl(gameWorld, this);
    }

    // ******************************************
    // ****** GETTER METHODS ********************
    // ******************************************

    public RobotControllerImpl getController() {
        return controller;
    }

    public GameWorld getGameWorld() {
        return gameWorld;
    }

    public int getID() {
        return ID;
    }

    public Team getTeam() {
        return team;
    }

    public MapLocation getLocation() {
        return location;
    }

    public MapLocation getDiedLocation() {
        return diedLocation;
    }

    public int getHealth() {
        return health;
    }

    public int getExp(SkillType skill) {
        if (skill == SkillType.BUILD)
            return buildExp;
        if (skill == SkillType.HEAL)
            return healExp;
        if (skill == SkillType.ATTACK)
            return attackExp;
        return 0;
    }

    public int getLevel(SkillType skill) {
        int exp = this.getExp(skill);
        for (int i = 0; i <= 5; i++) {
            if (exp < skill.getExperience(i + 1)) {
                return i;
            }
        }
        return 6;
    }

    
    public int getPaint() {
        return paintAmount;
    }    

    public void addPaint(int amount) {
        paintAmount += amount;
    }

    public boolean canAddFlag() {
        return flag == null;
    }

    public void addFlag(Flag flag) {
        this.flag = flag;
        flag.pickUp(this);
    }

    public boolean hasFlag() {
        return flag != null;
    }

    public Flag getFlag() {
        return flag;
    }

    public void removeFlag() {
        flag.drop();
        this.flag = null;
    }

    public long getControlBits() {
        return controlBits;
    }

    public int getBytecodesUsed() {
        return bytecodesUsed;
    }

    public int getRoundsAlive() {
        return roundsAlive;
    }

    public int getActionCooldownTurns() {
        return actionCooldownTurns;
    }

    public int getMovementCooldownTurns() {
        return movementCooldownTurns;
    }

    public RobotInfo getRobotInfo() {
        if (cachedRobotInfo != null
                && cachedRobotInfo.ID == ID
                && cachedRobotInfo.team == team
                && cachedRobotInfo.health == health
                && cachedRobotInfo.paintAmount == paintAmount
                && cachedRobotInfo.location.equals(location)
                && cachedRobotInfo.hasFlag == (flag != null)
                && cachedRobotInfo.attackLevel == SkillType.ATTACK.getLevel(attackExp)
                && cachedRobotInfo.healLevel == SkillType.HEAL.getLevel(healExp)
                && cachedRobotInfo.buildLevel == SkillType.BUILD.getLevel(buildExp)) {
            return cachedRobotInfo;
        }

        this.cachedRobotInfo = new RobotInfo(ID, team, health, location, flag != null,
                SkillType.ATTACK.getLevel(attackExp), SkillType.HEAL.getLevel(healExp),
                SkillType.BUILD.getLevel(buildExp), paintAmount);
        return this.cachedRobotInfo;
    }

    // **********************************
    // ****** CHECK METHODS *************
    // **********************************

    /**
     * Returns whether the robot can spawn, based on cooldowns.
     */
    public boolean canSpawnCooldown() {
        return this.spawnCooldownTurns < GameConstants.COOLDOWN_LIMIT;
    }

    /**
     * Returns whether the robot can perform actions, based on cooldowns.
     */
    public boolean canActCooldown() {
        return this.actionCooldownTurns < GameConstants.COOLDOWN_LIMIT;
    }

    /**
     * Returns whether the robot can move, based on cooldowns.
     */
    public boolean canMoveCooldown() {
        return this.movementCooldownTurns < GameConstants.COOLDOWN_LIMIT;
    }

    /**
     * Returns the robot's vision radius squared.
     */
    public int getVisionRadiusSquared() {
        return GameConstants.VISION_RADIUS_SQUARED;
    }

    /**
     * Returns whether this robot can sense the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canSenseLocation(MapLocation toSense) {
        return this.location.distanceSquaredTo(toSense) <= getVisionRadiusSquared();
    }

    /**
     * Returns whether this robot can sense a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canSenseRadiusSquared(int radiusSquared) {
        return radiusSquared <= getVisionRadiusSquared();
    }

    // ******************************************
    // ****** UPDATE METHODS ********************
    // ******************************************

    /**
     * Sets the indicator string of the robot.
     *
     * @param string the new indicator string of the robot
     */
    public void setIndicatorString(String string) {
        this.indicatorString = string;
    }

    /**
     * Sets the location of the robot.
     * 
     * @param loc the new location of the robot
     */
    public void setLocation(MapLocation loc) {
        this.gameWorld.moveRobot(getLocation(), loc);
        this.gameWorld.getObjectInfo().moveRobot(this, loc);
        if (flag != null)
            flag.setLoc(loc);
        this.location = loc;
    }

    /**
     * Resets the action cooldown.
     */
    public void addActionCooldownTurns(int numActionCooldownToAdd) {
        setActionCooldownTurns(this.actionCooldownTurns + numActionCooldownToAdd);
    }
    
    /**
     * Resets the movement cooldown.
     */
    public void addMovementCooldownTurns() {
        int movementCooldown = GameConstants.MOVEMENT_COOLDOWN;
      if (paintAmount < GameConstants.MOVEMENT_COOLDOWN) {
        movementCooldown = (int) Math.round(GameConstants.MOVEMENT_COOLDOWN * (GameConstants.MOVEMENT_COOLDOWN_INTERCEPT + GameConstants.MOVEMENT_COOLDOWN_SLOPE * paintAmount) / 100.0);
      }
       this.setMovementCooldownTurns(this.movementCooldownTurns + movementCooldown);
    }

    /**
     * Sets the action cooldown given the number of turns.
     * 
     * @param newActionTurns the number of action cooldown turns
     */
    public void setActionCooldownTurns(int newActionTurns) {
        this.actionCooldownTurns = newActionTurns;
    }

    /**
     * Sets the movement cooldown given the number of turns.
     * 
     * @param newMovementTurns the number of movement cooldown turns
     */
    public void setMovementCooldownTurns(int newMovementTurns) {
        this.movementCooldownTurns = newMovementTurns;
    }

    /**
     * Adds health to a robot. Input can be negative to subtract health.
     * 
     * @param healthAmount the amount to change health by (can be negative)
     */
    public void addHealth(int healthAmount) {
        this.health += healthAmount;
        this.health = Math.min(this.health, GameConstants.DEFAULT_HEALTH);
        if (this.health <= 0) {
            this.gameWorld.destroyRobot(this.ID);
        }
    }

    /**
     * increment exp for a robot
     */
    public void incrementSkill(SkillType skill) {
        if (skill == SkillType.BUILD)
            if (this.buildExp < skill.getExperience(3)
                    || (getLevel(SkillType.HEAL) < 4 && getLevel(SkillType.ATTACK) < 4)) {
                this.buildExp++;
            }
        if (skill == SkillType.HEAL)
            if (this.healExp < skill.getExperience(3)
                    || (getLevel(SkillType.BUILD) < 4 && getLevel(SkillType.ATTACK) < 4)) {
                this.healExp++;
            }
        if (skill == SkillType.ATTACK)
            if (this.attackExp < skill.getExperience(3)
                    || (getLevel(SkillType.BUILD) < 4 && getLevel(SkillType.HEAL) < 4)) {
                this.attackExp++;
            }
    }

    // *********************************
    // ****** ACTION METHODS *********
    // *********************************

    /**
     * Spawns the robot at the location provided
     * 
     * @param loc the new location of the robot
     */
    public void spawn(MapLocation loc) {
        this.spawned = true;
        this.location = loc;
        this.roundsAlive = 0;
        this.health = GameConstants.DEFAULT_HEALTH;
        // this.actionCooldownTurns = GameConstants.COOLDOWN_LIMIT;
        // this.movementCooldownTurns = GameConstants.COOLDOWN_LIMIT;
    }

    public boolean isSpawned() {
        return this.spawned;
    }

    public int getDamage() {
        int baseDamage = SkillType.ATTACK.skillEffect;
        if (this.gameWorld.getTeamInfo().getGlobalUpgrades(team)[0])
            baseDamage += GlobalUpgrade.ATTACK.baseAttackChange;
        int damage = Math.round(
                baseDamage * ((float) SkillType.ATTACK.getSkillEffect(this.getLevel(SkillType.ATTACK)) / 100 + 1));
        return damage;
    }

    private int locationToInt(MapLocation loc) {
        return this.gameWorld.locationToIndex(loc);
    }

    /**
     * Attacks another location if there is an opponent robot.
     * 
     * @param loc the location of the bot
     */
    public void attack(MapLocation loc) {
        InternalRobot bot = this.gameWorld.getRobot(loc);
        if (bot == null || bot.getTeam() == this.getTeam()) {
            // If robot is null or of your team, no damage; otherwise do damage
            this.getGameWorld().getMatchMaker().addAction(getID(), Action.ATTACK, -locationToInt(loc) - 1);
        } else {
            int dmg = getDamage();

            int newEnemyHealth = bot.getHealth() - dmg;
            if (newEnemyHealth <= 0) {
                if (gameWorld.getTeamSide(getLocation()) == (team.opponent() == Team.A ? 1 : 2)) {
                    addResourceAmount(GameConstants.KILL_CRUMB_REWARD);
                }
            }

            bot.addHealth(-dmg);
            incrementSkill(SkillType.ATTACK);
            this.gameWorld.getMatchMaker().addAction(getID(), Action.ATTACK, bot.getID());
        }
    }

    public void buildRobot(RobotOrTowerType type, MapLocation loc) {
        throw new NotImplementedException();
        // TODO not implemented
    }

    public int getHeal() {
        int base_heal = SkillType.HEAL.skillEffect;
        // check for upgrade
        if (this.gameWorld.getTeamInfo().getGlobalUpgrades(team)[2]) {
            base_heal += GlobalUpgrade.HEALING.baseHealChange;
        }
        return Math.round(base_heal * ((float) SkillType.HEAL.getSkillEffect(this.getLevel(SkillType.HEAL)) / 100 + 1));
    }

    public int getBuildExp() {
        return this.buildExp;
    }

    public int getHealExp() {
        return this.healExp;
    }

    public int getAttackExp() {
        return this.attackExp;
    }

    public void addTrapTrigger(Trap t, boolean entered) {
        this.trapsToTrigger.add(t);
        this.enteredTraps.add(entered);
    }

    // *********************************
    // ****** GAMEPLAY METHODS *********
    // *********************************

    // should be called at the beginning of every round
    public void processBeginningOfRound() {
        this.indicatorString = "";
        this.diedLocation = null;
    }

    public void processBeginningOfTurn() {
        this.actionCooldownTurns = Math.max(0, this.actionCooldownTurns - GameConstants.COOLDOWNS_PER_TURN);
        this.movementCooldownTurns = Math.max(0, this.movementCooldownTurns - GameConstants.COOLDOWNS_PER_TURN);
        this.spawnCooldownTurns = Math.max(0, this.spawnCooldownTurns - GameConstants.COOLDOWNS_PER_TURN);
        this.currentBytecodeLimit = GameConstants.BYTECODE_LIMIT;
    }

    public void processEndOfTurn() {
        for (int i = 0; i < trapsToTrigger.size(); i++) {
            this.gameWorld.triggerTrap(trapsToTrigger.get(i), this, enteredTraps.get(i));
        }
        this.trapsToTrigger = new ArrayList<>();
        this.enteredTraps = new ArrayList<>();
        // bytecode stuff!
        this.gameWorld.getMatchMaker().addBytecodes(this.ID, this.bytecodesUsed);
        // indicator strings!
        if (!indicatorString.equals(""))
            this.gameWorld.getMatchMaker().addIndicatorString(this.ID, this.indicatorString);
        this.roundsAlive++;
    }

    // *********************************
    // ****** BYTECODE METHODS *********
    // *********************************

    public boolean canExecuteCode() {
        return true;
    }

    public void setBytecodesUsed(int numBytecodes) {
        this.bytecodesUsed = numBytecodes;
    }

    public int getBytecodeLimit() {
        return canExecuteCode() ? this.currentBytecodeLimit : 0;
    }

    // *********************************
    // ****** VARIOUS METHODS **********
    // *********************************

    public void die_exception() {
        this.gameWorld.getMatchMaker().addAction(getID(), Action.DIE_EXCEPTION, -1);
        this.gameWorld.destroyRobot(getID());
    }

    // *****************************************
    // ****** MISC. METHODS ********************
    // *****************************************

    @Override
    public boolean equals(Object o) {
        return o != null && (o instanceof InternalRobot)
                && ((InternalRobot) o).getID() == ID;
    }

    @Override
    public int hashCode() {
        return ID;
    }

    @Override
    public String toString() {
        return String.format("%s#%d", getTeam(), getID());
    }

    @Override
    public int compareTo(InternalRobot o) {
        if (this.roundsAlive != o.roundsAlive)
            return this.roundsAlive - o.roundsAlive;
        return this.ID - o.ID;
    }
}
