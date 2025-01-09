package battlecode.world;

import battlecode.common.*;
import battlecode.schema.Action;

import java.util.ArrayList;
import java.util.Queue;
import java.util.LinkedList;

import org.apache.commons.lang3.NotImplementedException;

/**
 * The representation of a robot used by the server.
 * Comparable ordering:
 * - tiebreak by creation time (priority to later creation)
 * - tiebreak by robot ID (priority to lower ID)
 */
public class InternalRobot implements Comparable<InternalRobot> {

    private final RobotControllerImpl controller;
    protected final GameWorld gameWorld;

    private int paintAmount;
    private UnitType type;

    private final int ID;
    private Team team;
    private MapLocation location;
    private MapLocation diedLocation;
    private int health;

    private long controlBits;
    private int currentBytecodeLimit;
    private int bytecodesUsed;

    private int roundsAlive;
    private int turnsWithoutPaint;
    private int actionCooldownTurns;
    private int movementCooldownTurns;

    private Queue<Message> incomingMessages;
    private boolean towerHasSingleAttacked;
    private boolean towerHasAreaAttacked;

    // the number of messages this robot/tower has sent this turn
    private int sentMessagesCount;

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
    public InternalRobot(GameWorld gw, int id, Team team, UnitType type, MapLocation loc) {
        this.gameWorld = gw;

        this.ID = id;
        this.team = team;
        this.type = type;

        this.location = loc;
        this.diedLocation = null;
        this.health = type.health;
        this.incomingMessages = new LinkedList<>();
        this.towerHasSingleAttacked = this.towerHasAreaAttacked = false;

        this.paintAmount = 0;

        this.controlBits = 0;
        this.currentBytecodeLimit = type.isRobotType() ? GameConstants.ROBOT_BYTECODE_LIMIT : GameConstants.TOWER_BYTECODE_LIMIT;
        this.bytecodesUsed = 0;

        this.roundsAlive = 0;
        this.turnsWithoutPaint = 0;
        this.actionCooldownTurns = type.actionCooldown;
        this.movementCooldownTurns = GameConstants.COOLDOWN_LIMIT;

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

    public UnitType getType() {
        return type;
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

    public int getPaint() {
        return paintAmount;
    }

    public void addPaint(int amount) {
        int newPaintAmount = this.paintAmount + amount;
        if (newPaintAmount > this.type.paintCapacity) {
            this.paintAmount = this.type.paintCapacity;
        } else if (newPaintAmount < 0) {
            this.paintAmount = 0;
        } else {
            this.paintAmount = newPaintAmount;
        }
    }

    public boolean hasTowerSingleAttacked() {
        return this.towerHasSingleAttacked;
    }

    public boolean hasTowerAreaAttacked() {
        return this.towerHasAreaAttacked;
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
                && cachedRobotInfo.location.equals(location)) {
            return cachedRobotInfo;
        }

        this.cachedRobotInfo = new RobotInfo(ID, team, type, health, location, paintAmount);
        return this.cachedRobotInfo;
    }

    // **********************************
    // ****** CHECK METHODS *************
    // **********************************

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
        this.location = loc;
    }

    /**
     * Upgrades the level of a tower.
     * 
     * @param robot the tower to be upgraded
     */
    public void upgradeTower(UnitType newType) {
        int damage = this.type.health - getHealth();
        this.type = newType;
        this.health = newType.health - damage; 
    }

    /**
     * Resets the action cooldown.
     */
    public void addActionCooldownTurns(int numActionCooldownToAdd) {
        int paintPercentage = (int) Math.round(this.paintAmount * 100.0/ this.type.paintCapacity);
        if (paintPercentage < GameConstants.INCREASED_COOLDOWN_THRESHOLD && type.isRobotType()) {
            numActionCooldownToAdd += (int) Math.round(numActionCooldownToAdd
                    * (GameConstants.INCREASED_COOLDOWN_INTERCEPT + GameConstants.INCREASED_COOLDOWN_SLOPE * paintPercentage)
                    / 100.0);
        }
        setActionCooldownTurns(this.actionCooldownTurns + numActionCooldownToAdd);
    }

    /**
     * Resets the movement cooldown.
     */
    public void addMovementCooldownTurns() {
        int movementCooldown = GameConstants.MOVEMENT_COOLDOWN;
        int paintPercentage = (int) Math.round(this.paintAmount * 100.0/ this.type.paintCapacity);
        if (paintPercentage < GameConstants.INCREASED_COOLDOWN_THRESHOLD && type.isRobotType()) {
            movementCooldown += (int) Math.round(movementCooldown
                    * (GameConstants.INCREASED_COOLDOWN_INTERCEPT + GameConstants.INCREASED_COOLDOWN_SLOPE * paintPercentage)
                    / 100.0);
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
        this.health = Math.min(this.health, this.type.health);
        if (this.health <= 0) {
            this.gameWorld.destroyRobot(this.ID, false, true);
        }
    }

    // *********************************
    // ****** ACTION METHODS *********
    // *********************************

    private int locationToInt(MapLocation loc) {
        return this.gameWorld.locationToIndex(loc);
    }

    public void soldierAttack(MapLocation loc, boolean useSecondaryColor) {
        if(this.type != UnitType.SOLDIER)
            throw new RuntimeException("Unit must be a soldier");
        int paintType = (useSecondaryColor ? this.gameWorld.getSecondaryPaint(this.team) : this.gameWorld.getPrimaryPaint(this.team));
        
        // This attack costs some paint
        addPaint(-UnitType.SOLDIER.attackCost);

        // Attack if it's a tower
        if(this.gameWorld.getRobot(loc) != null && this.gameWorld.getRobot(loc).getType().isTowerType()) {
            InternalRobot tower = this.gameWorld.getRobot(loc);
            if(this.team != tower.getTeam()){
                tower.addHealth(-UnitType.SOLDIER.attackStrength);
                this.gameWorld.getMatchMaker().addDamageAction(tower.ID, UnitType.SOLDIER.attackStrength);
                this.gameWorld.getMatchMaker().addAttackAction(tower.ID);
            }
        } else { // otherwise, maybe paint
            // If the tile is empty or same team paint, paint it
            if(this.gameWorld.isPaintable(loc) && 
            (this.gameWorld.getPaint(loc) == 0 || this.gameWorld.teamFromPaint(paintType) == this.gameWorld.teamFromPaint(this.gameWorld.getPaint(loc)))) {
                this.gameWorld.setPaint(loc, paintType);
                this.gameWorld.getMatchMaker().addPaintAction(loc, useSecondaryColor);
            }
        }

    }
    public void soldierAttack(MapLocation loc) {
        soldierAttack(loc, false);
    }

    public void splasherAttack(MapLocation loc, boolean useSecondaryColor) {
        if(this.type != UnitType.SPLASHER)
            throw new RuntimeException("Unit must be a splasher");
        this.gameWorld.getMatchMaker().addSplashAction(loc);
        int paintType = (useSecondaryColor ? this.gameWorld.getSecondaryPaint(this.team) : this.gameWorld.getPrimaryPaint(this.team));

        // This attack costs some paint
        addPaint(-UnitType.SPLASHER.attackCost);

        MapLocation[] allLocs = this.gameWorld.getAllLocationsWithinRadiusSquared(loc, 4);
        for(MapLocation newLoc : allLocs) {
            // Attack if it's a tower (only if different team)
            if(this.gameWorld.getRobot(newLoc) != null && this.gameWorld.getRobot(newLoc).getType().isTowerType()) {
                InternalRobot tower = this.gameWorld.getRobot(newLoc);
                if(this.team != tower.getTeam()){
                    tower.addHealth(-UnitType.SPLASHER.aoeAttackStrength);
                    this.gameWorld.getMatchMaker().addDamageAction(tower.ID, UnitType.SPLASHER.aoeAttackStrength);
                    this.gameWorld.getMatchMaker().addAttackAction(tower.ID);
                }
            }  
            // If the tile is empty or same team paint, paint it
            if (!this.gameWorld.isPaintable(newLoc)) continue;
            if(this.gameWorld.getPaint(newLoc) == 0 || getTeam() == this.gameWorld.teamFromPaint(this.gameWorld.getPaint(newLoc))) {
                this.gameWorld.setPaint(newLoc, paintType);
                this.gameWorld.getMatchMaker().addPaintAction(newLoc, useSecondaryColor);
            } else { // If the tile has opposite enemy team, paint only if within sqrt(2) radius
                if(loc.isWithinDistanceSquared(newLoc, 2)){
                    this.gameWorld.setPaint(newLoc, paintType);
                    this.gameWorld.getMatchMaker().addPaintAction(newLoc, useSecondaryColor);
                }
            }
        }
    }
    public void splasherAttack(MapLocation loc) {
        splasherAttack(loc, false);
    }

    // This is the first kind of attack for moppers which only targets one location
    public void mopperAttack(MapLocation loc, boolean useSecondaryColor) {
        if(this.type != UnitType.MOPPER)
            throw new RuntimeException("Unit must be a mopper");
        int paintType = (useSecondaryColor ? this.gameWorld.getSecondaryPaint(this.team) : this.gameWorld.getPrimaryPaint(this.team));

        // This attack should be free (but this is here just in case)
        addPaint(-UnitType.MOPPER.attackCost);

        // If there's a robot on the tile, remove 10 from their paint stash and add 5 to ours
        if(this.gameWorld.getRobot(loc) != null && this.gameWorld.getRobot(loc).getType().isRobotType()) {
            InternalRobot robot = this.gameWorld.getRobot(loc);
            if(this.team != robot.getTeam()) {
                robot.addPaint(-GameConstants.MOPPER_ATTACK_PAINT_DEPLETION);
                addPaint(GameConstants.MOPPER_ATTACK_PAINT_ADDITION);
                this.gameWorld.getMatchMaker().addAttackAction(robot.getID());
                this.gameWorld.getMatchMaker().addRemovePaintAction(robot.getID(), GameConstants.MOPPER_ATTACK_PAINT_DEPLETION);
            }
        }
        
        // Either way, mop this tile if it has enemy paint
        if(this.gameWorld.isPaintable(loc) && this.gameWorld.teamFromPaint(paintType) != this.gameWorld.teamFromPaint(this.gameWorld.getPaint(loc))) {
            this.gameWorld.setPaint(loc, 0);
            this.gameWorld.getMatchMaker().addUnpaintAction(loc);
        }

    }
    public void mopperAttack(MapLocation loc) {
        mopperAttack(loc, false);
    }

    public void towerAttack(MapLocation loc) {
        if(!this.type.isTowerType())
            throw new RuntimeException("Unit must be a tower");

        if(loc == null) { // area attack
            this.towerHasAreaAttacked = true;
            int aoeDamage = this.type.aoeAttackStrength + (int) Math.round(this.gameWorld.getDefenseTowerDamageIncrease(team) * GameConstants.DEFENSE_ATTACK_BUFF_AOE_EFFECTIVENESS/100.0);

            MapLocation[] allLocs = this.gameWorld.getAllLocationsWithinRadiusSquared(this.getLocation(), this.type.actionRadiusSquared);
            for(MapLocation newLoc : allLocs) {
                // Attack if there is a unit (only if different team)
                if(this.gameWorld.getRobot(newLoc) != null) {
                    InternalRobot unit = this.gameWorld.getRobot(newLoc);
                    if(this.team != unit.getTeam()){
                        unit.addHealth(-aoeDamage);
                        this.gameWorld.getMatchMaker().addAttackAction(unit.getID());
                        this.gameWorld.getMatchMaker().addDamageAction(unit.getID(), aoeDamage);
                    }
                }
            }
        } else { // single attack
            this.towerHasSingleAttacked = true;

            if(this.gameWorld.getRobot(loc) != null) {
                InternalRobot unit = this.gameWorld.getRobot(loc);
                if(this.team != unit.getTeam()){
                    int damage = this.type.attackStrength + this.gameWorld.getDefenseTowerDamageIncrease(team);
                    unit.addHealth(-damage);
                    this.gameWorld.getMatchMaker().addAttackAction(unit.getID());
                    this.gameWorld.getMatchMaker().addDamageAction(unit.getID(), damage);
                }
            }
        }

    }

    public void mopSwing(Direction dir) { // NOTE: only works for moppers!
        // swing even if there's not 3 robots there, just remove from existing
        if(this.type != UnitType.MOPPER)
            throw new RuntimeException("Unit must be a mopper");
        if(!(dir == Direction.SOUTH || dir == Direction.NORTH || dir == Direction.WEST || dir == Direction.EAST))
            throw new RuntimeException("Direction must be a cardinal direction");

        // NORTH, SOUTH, EAST, WEST
        int[][] dx = {{-1, 0, 1}, {-1, 0, 1}, {1, 1, 1}, {-1, -1, -1}};
        int[][] dy = {{1, 1, 1}, {-1, -1, -1}, {-1, 0, 1}, {-1, 0, 1}};
        int dirIdx = 0;
        if(dir == Direction.SOUTH) dirIdx = 1;
        else if(dir == Direction.EAST) dirIdx = 2;
        else if(dir == Direction.WEST) dirIdx = 3;
        ArrayList<Integer> affectedIDs = new  ArrayList<>();

        for(int i = 0; i < 3; i ++) { // check all three spots
            int x = this.getLocation().x + dx[dirIdx][i], y = this.getLocation().y + dy[dirIdx][i];
            MapLocation newLoc = new MapLocation(x, y);
            if(!this.gameWorld.getGameMap().onTheMap(newLoc)) continue;

            // Attack if it's a robot (only if different team)
            if(this.gameWorld.getRobot(newLoc) != null && this.gameWorld.getRobot(newLoc).getType().isRobotType()) {
                InternalRobot robot = this.gameWorld.getRobot(newLoc);
                if(this.team != robot.getTeam()){
                    robot.addPaint(-GameConstants.MOPPER_SWING_PAINT_DEPLETION);
                    affectedIDs.add(robot.ID);
                    this.gameWorld.getMatchMaker().addRemovePaintAction(robot.getID(), GameConstants.MOPPER_SWING_PAINT_DEPLETION);
                }
            }
        }
        for (int i = 0; i < 3; i++) affectedIDs.add(0);
        this.gameWorld.getMatchMaker().addMopAction(affectedIDs.get(0), affectedIDs.get(1), affectedIDs.get(2));
    }

    /**
     * Attacks another location.
     * The type of attack is based on the robot type (specific methods above)
     * 
     * @param loc the location of the bot
     * @param useSecondaryColor whether to use secondary color or not
     */
    public void attack(MapLocation loc, boolean useSecondaryColor) {
        switch(this.getType()) {
            case SOLDIER:
                soldierAttack(loc, useSecondaryColor);
                break;
            case SPLASHER:
                splasherAttack(loc, useSecondaryColor);
                break;
            case MOPPER:
                mopperAttack(loc, useSecondaryColor);
                break; 
            default:
                towerAttack(loc);
                break;
        }
    }
    public void attack(MapLocation loc) {
        attack(loc, false);
    }

    // *********************************
    // ***** COMMUNICATION METHODS *****
    // *********************************

    public int getSentMessagesCount() {
        return sentMessagesCount;
    }

    public Message[] getMessages(){
        return incomingMessages.toArray(new Message[incomingMessages.size()]);
    }

    public Message getFrontMessage() {
        if (incomingMessages.isEmpty())
            return null;
        return incomingMessages.peek();
    }

    public void popMessage() {
        if (!incomingMessages.isEmpty())
            incomingMessages.remove();
    }

    private void addMessage(Message message) {
        incomingMessages.add(message);
    }

    public void sendMessage(InternalRobot robot, Message message) {
        robot.addMessage(message.copy());
        this.sentMessagesCount++;
    }

    private void cleanMessages() {
        while (!incomingMessages.isEmpty() && this.getFrontMessage().getRound() <= this.gameWorld.getCurrentRound()
                - GameConstants.MESSAGE_ROUND_DURATION) {
            this.popMessage();
        }
    }

    // ****************************
    // ****** GETTER METHODS ******
    // ****************************

    // *********************************
    // ****** GAMEPLAY METHODS *********
    // *********************************

    // should be called at the beginning of every round
    public void processBeginningOfRound() {
        this.cleanMessages();
        this.indicatorString = "";
        this.diedLocation = null;
        if (this.type.paintPerTurn != 0 )
            addPaint(this.type.paintPerTurn + this.gameWorld.extraResourcesFromPatterns(this.team));
        if (this.type.moneyPerTurn != 0)
            this.gameWorld.getTeamInfo().addMoney(this.team, this.type.moneyPerTurn+this.gameWorld.extraResourcesFromPatterns(this.team));
    }

    public void processBeginningOfTurn() {
        this.sentMessagesCount = 0;
        this.towerHasSingleAttacked = this.towerHasAreaAttacked = false;
        this.actionCooldownTurns = Math.max(0, this.actionCooldownTurns - GameConstants.COOLDOWNS_PER_TURN);
        this.movementCooldownTurns = Math.max(0, this.movementCooldownTurns - GameConstants.COOLDOWNS_PER_TURN);
        this.currentBytecodeLimit = this.type.isRobotType() ? GameConstants.ROBOT_BYTECODE_LIMIT : GameConstants.TOWER_BYTECODE_LIMIT;
        this.gameWorld.getMatchMaker().startTurn(this.ID);
    }

    public void processEndOfTurn() {
        // indicator strings!
        if (!indicatorString.equals("")) {
            this.gameWorld.getMatchMaker().addIndicatorString(this.ID, this.indicatorString);
        }
        this.gameWorld.getMatchMaker().endTurn(this.ID, this.health, this.paintAmount, this.movementCooldownTurns, this.actionCooldownTurns, this.bytecodesUsed, this.location);
        this.roundsAlive++;

        if (this.getType().isRobotType()){
            Team owningTeam = this.gameWorld.teamFromPaint(this.gameWorld.getPaint(this.location));
            int multiplier = this.getType() == UnitType.MOPPER ? GameConstants.MOPPER_PAINT_PENALTY_MULTIPLIER : 1;
            if (owningTeam == Team.NEUTRAL) {
                this.addPaint(-GameConstants.PENALTY_NEUTRAL_TERRITORY*multiplier);
            } else if (owningTeam == this.getTeam().opponent()) {
                this.addPaint(-GameConstants.PENALTY_ENEMY_TERRITORY*multiplier);
                int allyRobotCount = 0;
                for (InternalRobot robot : this.gameWorld.getAllRobotsWithinRadiusSquared(this.location, 2, this.team)){
                    if (robot.ID != this.ID)
                        allyRobotCount++;
                }
                this.addPaint(-2 * allyRobotCount);
            }
        }

        if (this.paintAmount == 0 && type.isRobotType()){
            this.turnsWithoutPaint += 1;
            if (this.turnsWithoutPaint == GameConstants.MAX_TURNS_WITHOUT_PAINT)
                this.gameWorld.destroyRobot(this.ID);
        }
        else{
            this.turnsWithoutPaint = 0;
        }
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
        this.gameWorld.destroyRobot(getID(), true, false);
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
