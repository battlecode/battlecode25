package battlecode.world;

import battlecode.common.*;

import static battlecode.common.GameActionExceptionType.*;
import battlecode.schema.Action;
import battlecode.util.FlatHelpers;
import battlecode.instrumenter.RobotDeathException;

import java.util.*;
import java.util.stream.Collectors;

import org.apache.commons.lang3.NotImplementedException;

/**
 * The actual implementation of RobotController. Its methods *must* be called
 * from a player thread.
 *
 * It is theoretically possible to have multiple for a single InternalRobot, but
 * that may cause problems in practice, and anyway why would you want to?
 *
 * All overriden methods should assertNotNull() all of their (Object) arguments,
 * if those objects are not explicitly stated to be nullable.
 */
public final class RobotControllerImpl implements RobotController {

    /**
     * The world the robot controlled by this controller inhabits.
     */
    private final GameWorld gameWorld;

    /**
     * The robot this controller controls.
     */
    private final InternalRobot robot;

    /**
     * Create a new RobotControllerImpl
     * 
     * @param gameWorld the relevant world
     * @param robot     the relevant robot
     */
    public RobotControllerImpl(GameWorld gameWorld, InternalRobot robot) {
        this.gameWorld = gameWorld;
        this.robot = robot;
    }

    // *********************************
    // ******** INTERNAL METHODS *******
    // *********************************

    /**
     * Throw a null pointer exception if an object is null.
     *
     * @param o the object to test
     */
    private static void assertNotNull(Object o) {
        if (o == null) {
            throw new NullPointerException("Argument has an invalid null value");
        }
    }

    @Override
    public int hashCode() {
        return getID();
    }

    private InternalRobot getRobotByID(int id) {
        if (!this.gameWorld.getObjectInfo().existsRobot(id))
            return null;
        return this.gameWorld.getObjectInfo().getRobotByID(id);
    }

    private int locationToInt(MapLocation loc) {
        return this.gameWorld.locationToIndex(loc);
    }

    private MapInfo getMapInfo(MapLocation loc) throws GameActionException {
        GameWorld gw = this.gameWorld;
        int mark = gw.getMarker(getTeam(), loc);
        PaintType markType = PaintType.EMPTY;
        if (mark == 1)
            markType = PaintType.ALLY_PRIMARY;
        else if (mark == 2)
            markType = PaintType.ALLY_SECONDARY;
        MapInfo currentLocInfo = new MapInfo(loc, gw.isPassable(loc), gw.getWall(loc), gw.getPaintType(getTeam(), loc), markType, gw.hasRuin(loc));
        return currentLocInfo;
    }

    // *********************************
    // ****** GLOBAL QUERY METHODS *****
    // *********************************

    @Override
    public int getRoundNum() {
        return this.gameWorld.getCurrentRound();
    }

    @Override
    public int getMapWidth() {
        return this.gameWorld.getGameMap().getWidth();
    }

    @Override
    public int getMapHeight() {
        return this.gameWorld.getGameMap().getHeight();
    }

    @Override
    public boolean[][] getResourcePattern(){
        return this.gameWorld.patternToBooleanArray(this.gameWorld.getResourcePattern());
    }

    @Override
    public boolean[][] getTowerPattern(UnitType type) throws GameActionException{
        assertIsTowerType(type);
        return this.gameWorld.patternToBooleanArray(this.gameWorld.getTowerPattern(type));
    }

    // *********************************
    // ****** UNIT QUERY METHODS *******
    // *********************************

    @Override
    public int getID() {
        return this.robot.getID();
    }

    @Override
    public Team getTeam() {
        return this.robot.getTeam();
    }

    @Override
    public int getPaint() {
        return this.robot.getPaint();
    }

    @Override
    public MapLocation getLocation() {
        return this.robot.getLocation();
    }

    @Override
    public int getHealth() {
        return this.robot.getHealth();
    }

    @Override
    public int getMoney() {
        return this.gameWorld.getTeamInfo().getMoney(getTeam());
    }

    @Override
    public int getChips() {
        return this.getMoney();
    }

    @Override
    public UnitType getType(){
        return this.robot.getType();
    }

    @Override
    public int getNumberTowers(){
        return this.gameWorld.getTeamInfo().getTotalNumberOfTowers(getTeam());
    }

    // ***********************************
    // ****** GENERAL VISION METHODS *****
    // ***********************************

    @Override
    public boolean onTheMap(MapLocation loc) {
        assertNotNull(loc);
        if (!this.gameWorld.getGameMap().onTheMap(loc))
            return false;
        return true;
    }

    private void assertCanSenseLocation(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        if (!this.gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location is not on the map");
        if (!this.robot.canSenseLocation(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within vision range");
    }

    private void assertCanActLocation(MapLocation loc, int maxRadiusSquared) throws GameActionException {
        assertNotNull(loc);
        if (getLocation().distanceSquaredTo(loc) > maxRadiusSquared)
            throw new GameActionException(OUT_OF_RANGE,
                    "Target location not within action range");
        if (!this.gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location is not on the map");
    }

    @Override
    public boolean canSenseLocation(MapLocation loc) {
        try {
            assertCanSenseLocation(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public boolean isLocationOccupied(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.getRobot(loc) != null;
    }

    @Override
    public boolean canSenseRobotAtLocation(MapLocation loc) {
        try {
            return isLocationOccupied(loc);
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public RobotInfo senseRobotAtLocation(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        InternalRobot bot = this.gameWorld.getRobot(loc);
        return bot == null ? null : bot.getRobotInfo();
    }

    @Override
    public boolean canSenseRobot(int id) {
        InternalRobot sensedRobot = getRobotByID(id);
        return sensedRobot != null && canSenseLocation(sensedRobot.getLocation());
    }

    @Override
    public RobotInfo senseRobot(int id) throws GameActionException {
        if (!canSenseRobot(id))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Can't sense given robot; It may be out of vision range or not exist anymore");
        return getRobotByID(id).getRobotInfo();
    }

    private void assertRadiusNonNegative(int radiusSquared) throws GameActionException {
        if (radiusSquared < -1) {
            throw new GameActionException(CANT_DO_THAT, "The radius for a sense command can't be negative and not -1");
        }
    }

    @Override
    public RobotInfo[] senseNearbyRobots() {
        try {
            return senseNearbyRobots(-1);
        } catch (GameActionException e) {
            return new RobotInfo[0];
        }
    }

    @Override
    public RobotInfo[] senseNearbyRobots(int radiusSquared) throws GameActionException {
        assertRadiusNonNegative(radiusSquared);
        return senseNearbyRobots(radiusSquared, null);
    }

    @Override
    public RobotInfo[] senseNearbyRobots(int radiusSquared, Team team) throws GameActionException {
        assertRadiusNonNegative(radiusSquared);
        return senseNearbyRobots(getLocation(), radiusSquared, team);
    }

    @Override
    public RobotInfo[] senseNearbyRobots(MapLocation center, int radiusSquared, Team team) throws GameActionException {
        assertNotNull(center);
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED
                : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        InternalRobot[] allSensedRobots = gameWorld.getAllRobotsWithinRadiusSquared(center, actualRadiusSquared, team);
        List<RobotInfo> validSensedRobots = new ArrayList<>();
        for (InternalRobot sensedRobot : allSensedRobots) {
            // check if this robot
            if (sensedRobot.equals(this.robot))
                continue;
            // check if can sense
            if (!canSenseLocation(sensedRobot.getLocation()))
                continue;
            // check if right team
            if (team != null && sensedRobot.getTeam() != team)
                continue;
            validSensedRobots.add(sensedRobot.getRobotInfo());
        }
        return validSensedRobots.toArray(new RobotInfo[validSensedRobots.size()]);
    }

    @Override
    public boolean sensePassability(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.isPassable(loc);
    }

    @Override
    public MapLocation[] senseNearbyRuins(int radiusSquared) throws GameActionException {
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED
                : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        return this.gameWorld.getAllRuinsWithinRadiusSquared(getLocation(), actualRadiusSquared);
    }

    @Override
    public MapInfo senseMapInfo(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanSenseLocation(loc);
        return getMapInfo(loc);
    }

    @Override
    public MapInfo[] senseNearbyMapInfos() {
        try {
            return senseNearbyMapInfos(-1);
        } catch (GameActionException e) {
            return new MapInfo[0];
        }
    }

    @Override
    public MapInfo[] senseNearbyMapInfos(int radiusSquared) throws GameActionException {
        assertRadiusNonNegative(radiusSquared);
        return senseNearbyMapInfos(getLocation(), radiusSquared);
    }

    @Override
    public MapInfo[] senseNearbyMapInfos(MapLocation center) throws GameActionException {
        assertNotNull(center);
        return senseNearbyMapInfos(center, -1);
    }

    @Override
    public MapInfo[] senseNearbyMapInfos(MapLocation center, int radiusSquared) throws GameActionException {
        assertNotNull(center);
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED
                : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        MapLocation[] allSensedLocs = gameWorld.getAllLocationsWithinRadiusSquared(center, actualRadiusSquared);
        List<MapInfo> validSensedMapInfo = new ArrayList<>();
        for (MapLocation mapLoc : allSensedLocs) {
            // Can't actually sense location
            if (!canSenseLocation(mapLoc)) {
                continue;
            }
            MapInfo mapInfo = getMapInfo(mapLoc);
            validSensedMapInfo.add(mapInfo);
        }
        return validSensedMapInfo.toArray(new MapInfo[validSensedMapInfo.size()]);
    }

    @Override
    public MapLocation adjacentLocation(Direction dir) {
        return getLocation().add(dir);
    }

    @Override
    public MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared)
            throws GameActionException {
        assertNotNull(center);
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED
                : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        MapLocation[] possibleLocs = this.gameWorld.getAllLocationsWithinRadiusSquared(center, actualRadiusSquared);
        List<MapLocation> visibleLocs = Arrays.asList(possibleLocs).stream().filter(x -> canSenseLocation(x))
                .collect(Collectors.toList());
        return visibleLocs.toArray(new MapLocation[visibleLocs.size()]);
    }

    // ***********************************
    // ****** READINESS METHODS **********
    // ***********************************

    private void assertIsActionReady() throws GameActionException {
        if (!this.robot.canActCooldown())
            throw new GameActionException(IS_NOT_READY,
                    "This robot's action cooldown has not expired.");
        if (this.robot.getPaint() == 0 && this.robot.getType().isRobotType()){
            throw new GameActionException(IS_NOT_READY, "This robot can't act at 0 paint.");
        }
    }

    @Override
    public boolean isActionReady() {
        try {
            assertIsActionReady();
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public int getActionCooldownTurns() {
        return this.robot.getActionCooldownTurns();
    }

    private void assertIsMovementReady() throws GameActionException {
        if (!this.robot.canMoveCooldown())
            throw new GameActionException(IS_NOT_READY,
                    "This robot's movement cooldown has not expired.");
        if (this.robot.getPaint() == 0 && this.robot.getType().isRobotType()){
            throw new GameActionException(IS_NOT_READY, "This robot can't move at 0 paint.");
        }
    }

    @Override
    public boolean isMovementReady() {
        try {
            assertIsMovementReady();
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public int getMovementCooldownTurns() {
        return this.robot.getMovementCooldownTurns();
    }

    // ***********************************
    // ****** MOVEMENT METHODS ***********
    // ***********************************

    private void assertCanMove(Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertIsMovementReady();
        MapLocation loc = adjacentLocation(dir);
        if (!onTheMap(loc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only move to locations on the map; " + loc + " is not on the map.");
        if (isLocationOccupied(loc))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot move to an occupied location; " + loc + " is occupied.");
        if (!this.gameWorld.isPassable(loc))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot move to an impassable location; " + loc + " is impassable.");
        if (this.getType().isTowerType())
            throw new GameActionException(CANT_DO_THAT, "Towers cannot move!");
    }

    @Override
    public boolean canMove(Direction dir) {
        try {
            assertCanMove(dir);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void move(Direction dir) throws GameActionException {
        assertCanMove(dir);
        MapLocation nextLoc = adjacentLocation(dir);
        this.robot.setLocation(nextLoc);
        this.robot.addMovementCooldownTurns();
    }

    // ***********************************
    // ******** BUILDING METHODS *********
    // ***********************************

    private void assertIsRobotType(UnitType type) throws GameActionException {
        if (!type.isRobotType()){
            throw new GameActionException(CANT_DO_THAT, "Given type " + type + " is not a robot type!");
        }
    }

    private void assertIsTowerType(UnitType type) throws GameActionException{
        if (!type.isTowerType()){
            throw new GameActionException(CANT_DO_THAT, "Given type " + type + " is not a tower type!");
        }
    }

    private void assertCanBuildRobot(UnitType type, MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertNotNull(type);
        assertCanActLocation(loc, GameConstants.BUILD_ROBOT_RADIUS_SQUARED);
        assertIsActionReady();
        assertIsTowerType(this.robot.getType());
        assertIsRobotType(type);

        if (this.robot.getPaint() < type.paintCost){
            throw new GameActionException(CANT_DO_THAT, "Not enough paint to build new robot!");
        }

        if (this.gameWorld.getTeamInfo().getMoney(this.robot.getTeam()) < type.moneyCost){
            throw new GameActionException(CANT_DO_THAT, "Not enough money to build new robot!");
        }

        if (isLocationOccupied(loc)){
            throw new GameActionException(CANT_DO_THAT, "Location is already occupied!");
        }

        if (!sensePassability(loc)){
            throw new GameActionException(CANT_DO_THAT, "Location has a wall or ruin!");
        }
    }

    @Override
    public boolean canBuildRobot(UnitType type, MapLocation loc) {
        try {
            assertCanBuildRobot(type, loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void buildRobot(UnitType type, MapLocation loc) throws GameActionException {
        assertCanBuildRobot(type, loc);
        this.robot.addActionCooldownTurns(GameConstants.BUILD_ROBOT_COOLDOWN);
        this.gameWorld.spawnRobot(type, loc, this.robot.getTeam());
        this.robot.addPaint(-type.paintCost);
        this.gameWorld.getTeamInfo().addMoney(this.robot.getTeam(), -type.moneyCost);
        InternalRobot robotSpawned = this.gameWorld.getRobot(loc);
        this.gameWorld.getMatchMaker().addSpawnAction(robotSpawned.getID(), loc, getTeam(), type);
    }

    private void assertCanMark(MapLocation loc) throws GameActionException {
        assertIsRobotType(this.robot.getType());
        assertCanActLocation(loc, GameConstants.MARK_RADIUS_SQUARED);
        if (!this.gameWorld.isPaintable(loc))
            throw new GameActionException(CANT_DO_THAT, "Can't place marks on squares that are not paintable!");
    }

    @Override
    public boolean canMark(MapLocation loc) {
        try {
            assertCanMark(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void mark(MapLocation loc, boolean secondary) throws GameActionException {
        assertCanMark(loc);
        this.gameWorld.setMarker(getTeam(), loc, secondary ? 2 : 1);
    }

    private void assertCanRemoveMark(MapLocation loc) throws GameActionException {
        assertIsRobotType(this.robot.getType());
        assertCanActLocation(loc, GameConstants.MARK_RADIUS_SQUARED);

        if (this.gameWorld.getMarker(getTeam(), loc) == 0) {
            throw new GameActionException(CANT_DO_THAT, "Cannot remove a nonexistent marker!");
        }
    }

    @Override
    public boolean canRemoveMark(MapLocation loc) {
        try {
            assertCanRemoveMark(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void removeMark(MapLocation loc) throws GameActionException {
        assertCanRemoveMark(loc);
        this.gameWorld.setMarker(getTeam(), loc, 0);
    }

    private void assertCanMarkTowerPattern(UnitType type, MapLocation loc) throws GameActionException {
        assertIsRobotType(this.robot.getType());
        assertIsTowerType(type);
        assertCanActLocation(loc, GameConstants.BUILD_TOWER_RADIUS_SQUARED);

        if (!this.gameWorld.hasRuin(loc)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot mark tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because the center is not a ruin");
        }

        if (!this.gameWorld.isValidPatternCenter(loc, true)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot mark tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because it is too close to the edge of the map");
        }

        if (this.robot.getPaint() < GameConstants.MARK_PATTERN_PAINT_COST){
            throw new GameActionException(CANT_DO_THAT, "This robot doesn't have enough paint to mark the tower pattern!");
        }
    }

    @Override
    public boolean canMarkTowerPattern(UnitType type, MapLocation loc) {
        try {
            assertCanMarkTowerPattern(type, loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void markTowerPattern(UnitType type, MapLocation loc) throws GameActionException {
        markTowerPattern(type, loc, 0, false);
    }

    public void markTowerPattern(UnitType type, MapLocation loc, int rotationAngle, boolean reflect) throws GameActionException {
        assertCanMarkTowerPattern(type, loc);
        if (rotationAngle < 0 || rotationAngle > 4)
            throw new GameActionException(CANT_DO_THAT, "Rotation angle should be one of 0, 1, 2, or 3 for" +
            "0, 90, 180, 270 degrees clockwise respectively!");
        this.robot.addPaint(-GameConstants.MARK_PATTERN_PAINT_COST);
        this.gameWorld.markTowerPattern(type, getTeam(), loc, rotationAngle, reflect);
    }

    private void assertCanUpgradeTower(MapLocation loc) throws GameActionException{
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.BUILD_TOWER_RADIUS_SQUARED);
        InternalRobot robot = this.gameWorld.getRobot(loc);

        if (robot == null){
            throw new GameActionException(CANT_DO_THAT, "There is no robot at the location");
        }
        if (!robot.getType().isTowerType()){ 
            throw new GameActionException(CANT_DO_THAT, "No tower at the location");
        }

        if (robot.getTeam() != this.robot.getTeam()){
            throw new GameActionException(CANT_DO_THAT, "Cannot upgrade tower of the enemy team!");
        }

        UnitType type = robot.getType();
        int moneyRequired = 0;

        if (!type.canUpgradeType()){
            throw new GameActionException(CANT_DO_THAT, "Cannot upgrade tower of this level!");
        }

        UnitType nextType = type.getNextLevel();
        moneyRequired = nextType.moneyCost;

        if (this.gameWorld.getTeamInfo().getMoney(this.robot.getTeam()) < moneyRequired){
            throw new GameActionException(CANT_DO_THAT, "Not enough money to upgrade tower!");
        }
    }

    @Override
    public boolean canUpgradeTower(MapLocation loc) {
        try {
            assertCanUpgradeTower(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }
    
    @Override
    public void upgradeTower(MapLocation loc) throws GameActionException{
        assertCanUpgradeTower(loc);
        InternalRobot robot = this.gameWorld.getRobot(loc);
        UnitType type = robot.getType();
        int moneyRequired = 0;
        UnitType newType = type.getNextLevel();
        moneyRequired += newType.moneyCost;
        this.gameWorld.getTeamInfo().addMoney(robot.getTeam(), -moneyRequired);
        robot.upgradeTower(newType);
        this.gameWorld.upgradeTower(newType, getTeam());
        this.gameWorld.getMatchMaker().addUpgradeAction(robot.getID(), robot.getHealth(), 
        robot.getType().health, robot.getPaint(), robot.getType().paintCapacity);
    }

    private void assertCanMarkResourcePattern(MapLocation loc) throws GameActionException {
        assertIsRobotType(this.robot.getType());
        assertCanActLocation(loc, GameConstants.RESOURCE_PATTERN_RADIUS_SQUARED);

        if (!this.gameWorld.isValidPatternCenter(loc, false)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot mark resource pattern centered at (" + loc.x + ", " + loc.y
                            + ") because it is blocked or too close to the edge of the map");
        }

        if (this.robot.getPaint() < GameConstants.MARK_PATTERN_PAINT_COST){
            throw new GameActionException(CANT_DO_THAT, "Cannot mark resource pattern because this robot doesn't have enough paint!");
        }
    }

    @Override
    public boolean canMarkResourcePattern(MapLocation loc) {
        try {
            assertCanMarkResourcePattern(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void markResourcePattern(MapLocation loc) throws GameActionException {
        markResourcePattern(loc, 0, false);
    }

    public void markResourcePattern(MapLocation loc, int rotationAngle, boolean reflect) throws GameActionException {
        assertCanMarkResourcePattern(loc);
        if (rotationAngle < 0 || rotationAngle > 4)
            throw new GameActionException(CANT_DO_THAT, "Rotation angle should be one of 0, 1, 2, or 3 for" +
            "0, 90, 180, 270 degrees clockwise respectively!");
        this.robot.addPaint(-GameConstants.MARK_PATTERN_PAINT_COST);
        this.gameWorld.markResourcePattern(getTeam(), loc, rotationAngle, reflect);
    }

    private void assertCanCompleteTowerPattern(UnitType type, MapLocation loc) throws GameActionException {
        type = type.getBaseType();
        assertIsRobotType(this.robot.getType());
        assertIsTowerType(type);
        assertCanActLocation(loc, GameConstants.BUILD_TOWER_RADIUS_SQUARED);

        if (this.gameWorld.hasTower(loc)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                        + ") because the center already contains a tower");
        }

        if (!this.gameWorld.hasRuin(loc)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because the center is not a ruin");
        }

        if (getMoney() < type.moneyCost){
            throw new GameActionException(CANT_DO_THAT,
            "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                    + ") because the team does not have enough money!"); 
        }

        if (!this.gameWorld.isValidPatternCenter(loc, true)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because it is too close to the edge of the map");
        }

        if (this.gameWorld.getRobot(loc) != null){
            throw new GameActionException(CANT_DO_THAT,
             "Cannot complete tower pattern at  (" + loc.x + ", " + loc.y
                    + ") because there is a robot at the center of the ruin");
        }

        boolean valid = this.gameWorld.checkTowerPattern(getTeam(), loc, type);

        if (!valid) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because the paint pattern is wrong");
        }


        if (this.gameWorld.getTeamInfo().getTotalNumberOfTowers(getTeam()) >= GameConstants.MAX_NUMBER_OF_TOWERS){
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete tower pattern centered at (" + loc.x + ", " + loc.y
                            + ") because limit number of towers was reached");
        }
    }

    @Override
    public boolean canCompleteTowerPattern(UnitType type, MapLocation loc) {
        try {
            assertCanCompleteTowerPattern(type, loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void completeTowerPattern(UnitType type, MapLocation loc) throws GameActionException {
        type = type.getBaseType();
        assertCanCompleteTowerPattern(type, loc);
        this.gameWorld.completeTowerPattern(getTeam(), type, loc);
        InternalRobot tower = this.gameWorld.getRobot(loc);
        this.gameWorld.getTeamInfo().addMoney(getTeam(), -type.moneyCost);
        this.gameWorld.getMatchMaker().addSpawnAction(tower.getID(), loc, tower.getTeam(), type);
        this.gameWorld.getMatchMaker().addBuildAction(tower.getID());
    }

    private void assertCanCompleteResourcePattern(MapLocation loc) throws GameActionException {
        assertIsRobotType(this.robot.getType());
        assertCanActLocation(loc, GameConstants.RESOURCE_PATTERN_RADIUS_SQUARED);

        if (!this.gameWorld.isValidPatternCenter(loc, false)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete resource pattern centered at (" + loc.x + ", " + loc.y
                            + ") because it is blocked or too close to the edge of the map");
        }

        boolean valid = this.gameWorld.checkResourcePattern(this.robot.getTeam(), loc);

        if (!valid) {
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot complete resource pattern centered at (" + loc.x + ", " + loc.y
                            + ") because the paint pattern is wrong");
        }
    }

    @Override
    public boolean canCompleteResourcePattern(MapLocation loc) {
        try {
            assertCanCompleteResourcePattern(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void completeResourcePattern(MapLocation loc) throws GameActionException {
        assertCanCompleteResourcePattern(loc);
        this.gameWorld.completeResourcePattern(getTeam(), loc);
        this.gameWorld.getMatchMaker().addCompleteResourcePatternAction(loc);
    }

    // *****************************
    // ****** ATTACK / HEAL ********
    // *****************************

    @Override
    public boolean canPaint(MapLocation loc){
        assertNotNull(loc);
        if (!onTheMap(loc))
            return false;
        // towers and moppers cannot paint tiles
        if (getType().isTowerType() || getType() == UnitType.MOPPER){
            return false;
        }
        if (getType() == UnitType.SOLDIER){
            if (loc.distanceSquaredTo(this.robot.getLocation()) > UnitType.SOLDIER.actionRadiusSquared)
                return false;
            return this.gameWorld.isPaintable(loc) && this.gameWorld.teamFromPaint(this.gameWorld.getPaint(loc)) != getTeam().opponent();
        }
        else{
            if (loc.distanceSquaredTo(this.robot.getLocation()) > UnitType.SPLASHER.actionRadiusSquared)
                return false;
            return this.gameWorld.isPaintable(loc);
        }
    }

    private void assertCanAttackSoldier(MapLocation loc) throws GameActionException {
        assertIsActionReady();
        assertCanActLocation(loc, UnitType.SOLDIER.actionRadiusSquared);
        if (this.robot.getPaint() < UnitType.SOLDIER.attackCost){
            throw new GameActionException(CANT_DO_THAT, "Unit does not have enough paint to do a soldier attack");
        }
        if (this.gameWorld.getWall(loc))
            throw new GameActionException(CANT_DO_THAT, "Soldiers cannot attack walls!");
    }

    private void assertCanAttackSplasher(MapLocation loc) throws GameActionException {
        assertIsActionReady();
        assertCanActLocation(loc, UnitType.SPLASHER.actionRadiusSquared);
        if (this.robot.getPaint() < UnitType.SPLASHER.attackCost){
            throw new GameActionException(CANT_DO_THAT, "Unit does not have enough paint to do a splasher attack");
        }
    }

    private void assertCanAttackMopper(MapLocation loc) throws GameActionException {
        assertIsActionReady();
        assertCanActLocation(loc, UnitType.MOPPER.actionRadiusSquared);
        if (this.robot.getPaint() < UnitType.MOPPER.attackCost){
            throw new GameActionException(CANT_DO_THAT, "Unit does not have enough paint to do a mopper attack");
        }
        if (!this.gameWorld.isPassable(loc))
            throw new GameActionException(CANT_DO_THAT, "Moppers cannot attack squares with walls or ruins on them!");
    }

    private void assertCanAttackTower(MapLocation loc) throws GameActionException {
        if(loc == null) { // area attack
            if (this.robot.hasTowerAreaAttacked()){
                throw new GameActionException(CANT_DO_THAT, "Tower has already done an area attack this turn");
            }
        } else { // single attack
            if (this.robot.hasTowerSingleAttacked()){
                throw new GameActionException(CANT_DO_THAT, "Tower has already done a single cell attack this turn");
            }
            assertCanActLocation(loc, this.robot.getType().actionRadiusSquared);
        }
    }

    private void assertCanAttack(MapLocation loc) throws GameActionException {
        if (loc == null && !this.robot.getType().isTowerType()){
            throw new GameActionException(CANT_DO_THAT, "Robot units must specify a location to attack");
        }

        // note: paint type is irrelevant for checking attack validity
        switch(this.robot.getType()) {
            case SOLDIER:
                assertCanAttackSoldier(loc);
                break;
            case SPLASHER:
                assertCanAttackSplasher(loc);
                break;
            case MOPPER:
                assertCanAttackMopper(loc);
                break; 
            default:
                assertCanAttackTower(loc);
                break;
        }
    }

    @Override
    public boolean canAttack(MapLocation loc) {
        try {
            assertCanAttack(loc);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void attack(MapLocation loc, boolean useSecondaryColor) throws GameActionException {
        assertCanAttack(loc);
        if (this.robot.getType().isRobotType())
            this.robot.addActionCooldownTurns(this.robot.getType().actionCooldown);
        this.robot.attack(loc, useSecondaryColor);
    }

    @Override
    public void attack(MapLocation loc) throws GameActionException {
        attack(loc, false);
    }

    private void assertCanMopSwing(Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertIsActionReady();
        if (!(dir == Direction.SOUTH || dir == Direction.NORTH || dir == Direction.WEST || dir == Direction.EAST)){
            throw new GameActionException(CANT_DO_THAT, "Must pass in a cardinal direction to mop swing");
        }
        if (this.robot.getType() != UnitType.MOPPER){
            throw new GameActionException(CANT_DO_THAT, "Unit must be a mopper!");
        }
        MapLocation nextLoc = this.robot.getLocation().add(dir);
        if (!onTheMap(nextLoc)){
            throw new GameActionException(CANT_DO_THAT, "Can't do a mop swing off the edge of the map!");
        }

    }

    @Override
    public boolean canMopSwing(Direction dir) {
        try {
            assertCanMopSwing(dir);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override
    public void mopSwing(Direction dir) throws GameActionException {
        this.robot.addActionCooldownTurns(GameConstants.ATTACK_MOPPER_SWING_COOLDOWN);
        this.robot.mopSwing(dir);
    }

    // ***********************************
    // ****** COMMUNICATION METHODS ******
    // ***********************************

    private void assertCanSendMessage(MapLocation loc, Message message) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.MESSAGE_RADIUS_SQUARED);
        assertNotNull(this.gameWorld.getRobot(loc));
        if (getTeam() != this.gameWorld.getRobot(loc).getTeam()){
            throw new GameActionException(CANT_DO_THAT, "Cannot send messages to robots of the enemy team!");
        }
        assertNotNull(message);

        // we also need them to be different (i.e. only robot to tower or vice versa)
        if (this.robot.getType().isRobotType() == this.gameWorld.getRobot(loc).getType().isRobotType()){
            throw new GameActionException(CANT_DO_THAT, "Only (robot <-> tower) communication is allowed!");
        }
        if (this.robot.getType().isRobotType()) {
            if (this.robot.getSentMessagesCount() >= GameConstants.MAX_MESSAGES_SENT_ROBOT){
                throw new GameActionException(CANT_DO_THAT, "Robot has already sent too many messages this round!");
            }
        } else {
            if (this.robot.getSentMessagesCount() >= GameConstants.MAX_MESSAGES_SENT_TOWER){
                throw new GameActionException(CANT_DO_THAT, "Tower has already sent too many messages this round!");
            }
        }
        
        // make sure the other unit is within the right distance and connected by paint
        if (this.robot.getLocation().distanceSquaredTo(loc) > GameConstants.MESSAGE_RADIUS_SQUARED){
            throw new GameActionException(CANT_DO_THAT, "Location specified is not within the message radius!");
        }

        MapLocation robotLoc = this.robot.getType().isTowerType() ? loc : this.robot.getLocation();
        MapLocation towerLoc = this.robot.getType().isTowerType() ? this.robot.getLocation() : loc;
        if (!this.gameWorld.connectedByPaint(this.robot.getTeam(), robotLoc, towerLoc)){
            throw new GameActionException(CANT_DO_THAT, "Location specified is not connected to current location by paint!");
        }
    }

    @Override
    public boolean canSendMessage(MapLocation loc) {
        // use dummy message content as does not affect if message can be sent
        return canSendMessage(loc, 0);
    }

    @Override
    public boolean canSendMessage(MapLocation loc, int messageContent) {
        try {
            Message message = new Message(messageContent, this.robot.getID(), this.gameWorld.getCurrentRound());
            assertCanSendMessage(loc, message);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    @Override
    public void sendMessage(MapLocation loc, int messageContent) throws GameActionException {
        Message message = new Message(messageContent, this.robot.getID(), this.gameWorld.getCurrentRound());
        assertCanSendMessage(loc, message);
        InternalRobot robot = this.gameWorld.getRobot(loc);
        this.robot.sendMessage(robot, message);
        this.gameWorld.getMatchMaker().addMessageAction(robot.getID(), messageContent);
    }

    @Override 
    public Message[] readMessages(int roundNum) {
        ArrayList<Message> messages = new ArrayList<>();
        for (Message m : this.robot.getMessages()){
            if (roundNum == -1 || m.getRound() == roundNum)
                messages.add(m);
        }
        return messages.toArray(new Message[messages.size()]);
    }

    // ***********************************
    // ****** OTHER ACTION METHODS *******
    // ***********************************

    private void assertCanTransferPaint(MapLocation loc, int amount) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.PAINT_TRANSFER_RADIUS_SQUARED);
        assertIsActionReady();
        InternalRobot robot = this.gameWorld.getRobot(loc);
        if (robot == null)
            throw new GameActionException(CANT_DO_THAT, "There is no robot at this location!");
        if (loc == this.robot.getLocation()) {
            throw new GameActionException(CANT_DO_THAT, "Cannot transfer paint to yourself!");
        }
        if (amount == 0) {
            throw new GameActionException(CANT_DO_THAT, "Cannot transfer zero paint!");
        }
        if (robot.getTeam() != this.robot.getTeam()) {
            throw new GameActionException(CANT_DO_THAT, "Cannot transfer resources to the enemy team!");
        }
        if (this.robot.getType().isTowerType()) {
            throw new GameActionException(CANT_DO_THAT, "Towers cannot transfer paint!");
        }
        if (amount > 0 && this.robot.getType() != UnitType.MOPPER) {
            throw new GameActionException(CANT_DO_THAT, "Only moppers can give paint to allies!");
        }
        if (robot.getType().isRobotType() && amount < 0) {
            throw new GameActionException(CANT_DO_THAT, "Paint can only be withdrawn from towers!");
        }
        if (-1 * amount > robot.getPaint()) {
            throw new GameActionException(CANT_DO_THAT, "Cannot take more paint from towers than they currently have!");
        }
        if (amount > this.robot.getPaint()) {
            throw new GameActionException(CANT_DO_THAT, "Cannot give more paint than you currently have!");
        }
    }

    public boolean canTransferPaint(MapLocation loc, int amount) {
        try {
            assertCanTransferPaint(loc, amount);
            return true;
        } catch (GameActionException e) {
            return false;
        }
    }

    public void transferPaint(MapLocation loc, int amount) throws GameActionException {
        assertCanTransferPaint(loc, amount);
        this.robot.addPaint(-1 * amount);
        InternalRobot robot = this.gameWorld.getRobot(loc);
        robot.addPaint(amount);
        this.robot.addActionCooldownTurns(GameConstants.PAINT_TRANSFER_COOLDOWN);
        this.gameWorld.getMatchMaker().addTransferAction(robot.getID(), amount);
    }

    @Override
    public void disintegrate() {
        throw new RobotDeathException();
    }

    @Override
    public void resign() {
        Team team = getTeam();
        gameWorld.getObjectInfo().eachRobot((robot) -> {
            if (robot.getTeam() == team) {
                gameWorld.destroyRobot(robot.getID());
            }
            return true;
        });
        gameWorld.setWinner(team.opponent(), DominationFactor.RESIGNATION);
    }

    // ***********************************
    // ******** DEBUG METHODS ************
    // ***********************************

    @Override
    public void setIndicatorString(String string) {
        if (string.length() > GameConstants.INDICATOR_STRING_MAX_LENGTH) {
            string = string.substring(0, GameConstants.INDICATOR_STRING_MAX_LENGTH);
        }
        this.robot.setIndicatorString(string);
    }

    @Override
    public void setIndicatorDot(MapLocation loc, int red, int green, int blue) throws GameActionException{
        assertNotNull(loc);
        if (!this.gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_DO_THAT, "Indicator dots should have map locations on the map!");
        this.gameWorld.getMatchMaker().addIndicatorDot(getID(), loc, red, green, blue);
    }

    @Override
    public void setIndicatorLine(MapLocation startLoc, MapLocation endLoc, int red, int green, int blue) throws GameActionException{
        assertNotNull(startLoc);
        assertNotNull(endLoc);
        if (!this.gameWorld.getGameMap().onTheMap(startLoc))
            throw new GameActionException(CANT_DO_THAT, "Indicator lines should have map locations on the map!");
        if (!this.gameWorld.getGameMap().onTheMap(endLoc))
            throw new GameActionException(CANT_DO_THAT, "Indicator lines should have map locations on the map!");
        this.gameWorld.getMatchMaker().addIndicatorLine(getID(), startLoc, endLoc, red, green, blue);
    }

    @Override 
    public void setTimelineMarker(String label, int red, int green, int blue){
        if (label.length() > GameConstants.TIMELINE_LABEL_MAX_LENGTH){
            label = label.substring(0, GameConstants.TIMELINE_LABEL_MAX_LENGTH);
        }
        this.gameWorld.getMatchMaker().addTimelineMarker(this.getTeam(), label, red, green, blue);
    }
}
