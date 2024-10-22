package battlecode.world;

import battlecode.common.*;

import static battlecode.common.GameActionExceptionType.*;
import battlecode.schema.Action;
import battlecode.util.FlatHelpers;

import java.util.*;
import java.util.stream.Collectors;

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
public final strictfp class RobotControllerImpl implements RobotController {

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
     * @param robot the relevant robot
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

        Trap trap = gw.getTrap(loc);
        TrapType type = (trap != null && trap.getTeam() == robot.getTeam()) ? trap.getType() : TrapType.NONE;

        int territory = gameWorld.getTeamSide(loc);
        Team territoryTeam = null;
        if(territory == 0) territoryTeam = Team.NEUTRAL;
        else territoryTeam = territory == 1 ? Team.A : Team.B;

        MapInfo currentLocInfo = new MapInfo(loc, gw.isPassable(loc), gw.getWall(loc), gw.getDam(loc),
            gw.getSpawnZone(loc), gw.getWater(loc), gw.getBreadAmount(loc), type, territoryTeam);

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
    public MapLocation getLocation() {
        return this.robot.getLocation();
    }

    @Override
    public int getExperience(SkillType skill){
        return this.robot.getExp(skill);
    }

    @Override
    public int getLevel(SkillType skill){
        return this.robot.getLevel(skill);
    }
 
    @Override
    public int getHealth() {
        return this.robot.getHealth();
    }
    @Override
    public int getCrumbs() {
        return this.gameWorld.getTeamInfo().getBread(getTeam());
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
        assertIsSpawned();
        if (!this.gameWorld.getGameMap().onTheMap(loc))
        throw new GameActionException(CANT_SENSE_THAT,
                "Target location is not on the map");
        if (!this.robot.canSenseLocation(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within vision range");
    }

    private void assertCanActLocation(MapLocation loc, int maxRadius) throws GameActionException {
        assertNotNull(loc);
        assertIsSpawned();
        if (getLocation().distanceSquaredTo(loc) > maxRadius)
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
        } catch (GameActionException e) { return false; }
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
        } catch (GameActionException e) { return false; }
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
        return sensedRobot == null || !sensedRobot.isSpawned() ? false : canSenseLocation(sensedRobot.getLocation());
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
        assertIsSpawned();
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
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
    public MapLocation[] senseNearbyCrumbs(int radiusSquared) throws GameActionException{
        assertRadiusNonNegative(radiusSquared);
        assertIsSpawned();
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);

        ArrayList<MapLocation> breadLocs = new ArrayList<>();
        for(MapLocation loc : getAllLocationsWithinRadiusSquared(getLocation(), actualRadiusSquared)) {
            if(gameWorld.getBreadAmount(loc) != 0) breadLocs.add(loc);
        }
        return breadLocs.toArray(new MapLocation[breadLocs.size()]);
    }

    @Override
    public boolean sensePassability(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.isPassable(loc);
    }

    @Override
    public FlagInfo[] senseNearbyFlags(int radiusSquared) throws GameActionException {
        return senseNearbyFlags(radiusSquared, null);
    }
  
    @Override
    public FlagInfo[] senseNearbyFlags(int radiusSquared, Team team) throws GameActionException {
        assertRadiusNonNegative(radiusSquared);
        assertIsSpawned();
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        ArrayList<FlagInfo> flagInfos = new ArrayList<>();
        for(Flag x : gameWorld.getAllFlags()) {
            if(x.getLoc().distanceSquaredTo(robot.getLocation()) <= actualRadiusSquared && (team == null || team == x.getTeam())) {
                flagInfos.add(new FlagInfo(x.getLoc(), x.getTeam(), x.isPickedUp(), x.getId()));
            }
        }
        return flagInfos.toArray(new FlagInfo[flagInfos.size()]);
    }

    @Override
    public MapLocation[] senseBroadcastFlagLocations() {
        List<MapLocation> locations = new ArrayList<MapLocation>();
        for(Flag x: gameWorld.getAllFlags()) {
            if(x.getTeam() != robot.getTeam() && !x.isPickedUp() && !canSenseLocation(x.getLoc())) locations.add(x.getBroadcastLoc());
        }
        return locations.toArray(new MapLocation[locations.size()]);
    }

    @Override
    public boolean senseLegalStartingFlagPlacement(MapLocation loc) throws GameActionException{
        assertCanSenseLocation(loc);
        if(!gameWorld.isPassable(loc)) return false;
        boolean hasFlag = robot.hasFlag();
        boolean valid = true;
        for(Flag x : gameWorld.getAllFlags()) {
            if((!hasFlag || x.getId() != robot.getFlag().getId()) && x.getTeam() == robot.getTeam() && 
                    x.getLoc().distanceSquaredTo(loc) <= GameConstants.MIN_FLAG_SPACING_SQUARED && !x.isPickedUp()) {
                valid = false;
                break;
            }
        }
        return valid;
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
        assertIsSpawned();
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
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
    public MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared) throws GameActionException {
        assertNotNull(center);
        assertRadiusNonNegative(radiusSquared);
        int actualRadiusSquared = radiusSquared == -1 ? GameConstants.VISION_RADIUS_SQUARED : Math.min(radiusSquared, GameConstants.VISION_RADIUS_SQUARED);
        MapLocation[] possibleLocs = this.gameWorld.getAllLocationsWithinRadiusSquared(center, actualRadiusSquared);
        List<MapLocation> visibleLocs = Arrays.asList(possibleLocs).stream().filter(x -> canSenseLocation(x)).collect(Collectors.toList());
        return visibleLocs.toArray(new MapLocation[visibleLocs.size()]);
    }

    // ***********************************
    // ****** READINESS METHODS **********
    // ***********************************

    private void assertIsSpawned() throws GameActionException {
        if (!this.robot.isSpawned()) {
            throw new GameActionException(IS_NOT_READY,
                    "This robot is not spawned in.");
        }
    }

    @Override
    public boolean isSpawned() {
        try {
            assertIsSpawned();
            return true;
        } catch (GameActionException e) { return false; }
    }

    private void assertIsActionReady() throws GameActionException {
        assertIsSpawned();
        if (!this.robot.canActCooldown())
            throw new GameActionException(IS_NOT_READY,
                    "This robot's action cooldown has not expired.");
    }

    @Override
    public boolean isActionReady() {
        try {
            assertIsActionReady();
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public int getActionCooldownTurns() {
        return this.robot.getActionCooldownTurns();
    }

    private void assertIsMovementReady() throws GameActionException {
        assertIsSpawned();
        if (!this.robot.canMoveCooldown())
            throw new GameActionException(IS_NOT_READY,
                    "This robot's movement cooldown has not expired.");
    }

    @Override
    public boolean isMovementReady() {
        try {
            assertIsMovementReady();
            return true;
        } catch (GameActionException e) { return false; }
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
        assertIsSpawned();
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
    }

    @Override
    public boolean canMove(Direction dir) {
        try {
            assertCanMove(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void move(Direction dir) throws GameActionException {
        assertCanMove(dir);
        MapLocation nextLoc = adjacentLocation(dir);
        Team[] allSpawnZones = {null, Team.A, Team.B};
        this.robot.setLocation(nextLoc);

        int amtBread = this.gameWorld.getBreadAmount(nextLoc);
        if(amtBread != 0) {
            this.robot.addResourceAmount(amtBread);
            this.gameWorld.getMatchMaker().addClaimedResource(nextLoc);
        }
        this.gameWorld.removeBread(nextLoc);
        this.robot.addMovementCooldownTurns();

        // trap trigger methods
        for(int i = this.gameWorld.getTrapTriggers(nextLoc).size()-1; i >= 0; i--){
            Trap trap = this.gameWorld.getTrapTriggers(nextLoc).get(i);
            if (trap.getTeam() == this.robot.getTeam()){
                continue;
            }
            this.robot.addTrapTrigger(trap, true);
        }
        
        if (this.robot.hasFlag() && this.robot.getFlag().getTeam() != this.robot.getTeam() 
                && allSpawnZones[this.gameWorld.getSpawnZone(nextLoc)] == this.getTeam()) {
            this.gameWorld.getTeamInfo().captureFlag(this.getTeam());
            this.gameWorld.getMatchMaker().addAction(getID(), Action.CAPTURE_FLAG, robot.getFlag().getId());
            robot.getFlag().setLoc(null);
            gameWorld.getAllFlags().remove(robot.getFlag());
            this.robot.removeFlag();
        }
    }

    // ***********************************
    // ************ SPAWNING *************
    // ***********************************

    public MapLocation[] getAllySpawnLocations(){
        MapLocation[] allyLocations = this.gameWorld.getSpawnLocations(getTeam());
        return Arrays.copyOf(allyLocations, allyLocations.length);

    }

    private void assertCanSpawn(MapLocation loc) throws GameActionException {
        if (isSpawned())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot cannot call spawn when already spawned in.");

        if (!this.robot.canSpawnCooldown())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is not ready to be spawned.");
        
        assertNotNull(loc);
        if (!onTheMap(loc)){
            throw new GameActionException(CANT_MOVE_THERE, "given location is not on the map");
        }

        if (this.gameWorld.getSpawnZone(loc) != getTeam().ordinal()+1)
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot spawn in a non-spawn location; " + loc + " is not a spawn location for your team");

        if (this.gameWorld.getRobot(loc) != null){
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot spawn to an occupied location; " + loc + " is occupied.");
        }

        if (!this.gameWorld.isPassable(loc)){
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot spawn to " + loc + "; It is not passable ");
        }
    }

    @Override
    public boolean canSpawn(MapLocation loc) {
        try {
            assertCanSpawn(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void spawn(MapLocation loc) throws GameActionException {
        assertCanSpawn(loc);
        this.gameWorld.addRobot(loc, robot);
        this.gameWorld.getObjectInfo().addRobotIndex(robot, loc);
        this.robot.spawn(loc);
        this.gameWorld.getMatchMaker().addSpawned(this.robot.getID(), this.robot.getTeam(), this.robot.getLocation());
    }

    // ***********************************
    // ****** BUILDING METHODS ********
    // ***********************************

    private void assertCanBuild(TrapType trap, MapLocation loc) throws GameActionException{
        assertNotNull(trap);
        assertCanActLocation(loc, GameConstants.INTERACT_RADIUS_SQUARED);
        assertIsActionReady();
        int resources = (int) Math.round(trap.buildCost*(1+0.01*SkillType.BUILD.getSkillEffect(this.robot.getLevel(SkillType.BUILD))));
        if (getCrumbs() < resources){
            throw new GameActionException(NOT_ENOUGH_RESOURCE, "Insufficient resources");
        }
        if(this.gameWorld.getAllRobotsWithinRadiusSquared(loc, 2, getTeam().opponent()).length != 0) {
            throw new GameActionException(CANT_DO_THAT, "Cannot place a trap directly on or next to an enemy robot.");
        }
        if (trap.equals(TrapType.EXPLOSIVE)){
            if (!this.gameWorld.isPassable(loc) && !this.gameWorld.getWater(loc))
                throw new GameActionException(CANT_DO_THAT, "Can only place explosive traps on land or water tiles");
        }
        else{
            if (!this.gameWorld.isPassable(loc))
                throw new GameActionException(CANT_DO_THAT, "Can only place this trap on land tiles.");
        }
        if (this.gameWorld.hasTrap(loc) && this.gameWorld.getTrap(loc).getTeam() == getTeam()){
            throw new GameActionException(CANT_DO_THAT, "Cannot place a trap on a tile with a friendly trap already on it.");
        }
        if(this.robot.hasFlag()) {
            throw new GameActionException(CANT_DO_THAT, "Can't build while holding a flag");
        }
    }

    @Override
    public boolean canBuild(TrapType trap, MapLocation loc){
        try{
            assertCanBuild(trap, loc);
            return true;
        }
        catch (GameActionException e){
            return false;
        }
    }

    @Override
    public void build(TrapType trap, MapLocation loc) throws GameActionException{
        assertCanBuild(trap, loc);
        int buildLevel = this.robot.getLevel(SkillType.BUILD);
        int cooldownIncrease = (int) Math.round(trap.actionCooldownIncrease*(1+.01*SkillType.BUILD.getCooldown(buildLevel)));
        int resources = (int) -Math.round(trap.buildCost*(1+0.01*SkillType.BUILD.getSkillEffect(buildLevel)));
        this.robot.addActionCooldownTurns(cooldownIncrease);
        this.robot.addResourceAmount(resources);
        
        if (this.gameWorld.hasTrap(loc) && this.gameWorld.getTrap(loc).getTeam() != getTeam() && this.gameWorld.getTrap(loc).getType() == TrapType.EXPLOSIVE){
            this.robot.addTrapTrigger(this.gameWorld.getTrap(loc), false);
            return;
        }

        this.gameWorld.placeTrap(loc, trap, this.getTeam());
        this.robot.incrementSkill(SkillType.BUILD);
    }

    private void assertCanFill(MapLocation loc) throws GameActionException {
        assertCanActLocation(loc, GameConstants.INTERACT_RADIUS_SQUARED);
        assertIsActionReady();
        if (!this.gameWorld.getWater(loc))
            throw new GameActionException(CANT_DO_THAT, "Can't fill a tile that is not water!");
        int resources = (int) Math.round(GameConstants.FILL_COST*(1+0.01*SkillType.BUILD.getSkillEffect(this.robot.getLevel(SkillType.BUILD))));
        if (getCrumbs() < resources)
            throw new GameActionException(NOT_ENOUGH_RESOURCE, "Insufficient resources to fill.");
        if(this.robot.hasFlag()) {
            throw new GameActionException(CANT_DO_THAT, "Can't fill while holding a flag");
        }
    }

    @Override
    public boolean canFill(MapLocation loc) {
        try {
            assertCanFill(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void fill(MapLocation loc) throws GameActionException{
        assertCanFill(loc);
        int buildLevel = this.robot.getLevel(SkillType.BUILD);
        int cooldownIncrease = (int) Math.round(GameConstants.FILL_COOLDOWN*(1+.01*SkillType.BUILD.getCooldown(buildLevel)));
        int resources = (int) -Math.round(GameConstants.FILL_COST*(1+0.01*SkillType.BUILD.getSkillEffect(buildLevel)));
        this.robot.addActionCooldownTurns(cooldownIncrease);
        this.robot.addResourceAmount(resources);
        this.gameWorld.getMatchMaker().addAction(getID(), Action.FILL, locationToInt(loc));
        this.gameWorld.getMatchMaker().addFillLocation(loc);
        this.gameWorld.setLand(loc);

        if (this.gameWorld.hasTrap(loc) && this.gameWorld.getTrap(loc).getTeam() != getTeam() && this.gameWorld.getTrap(loc).getType() == TrapType.EXPLOSIVE){
            this.robot.addTrapTrigger(this.gameWorld.getTrap(loc), false);
        }
    }

    private void assertCanDig(MapLocation loc) throws GameActionException {
        assertCanActLocation(loc, GameConstants.INTERACT_RADIUS_SQUARED);
        assertIsActionReady();
        if (this.gameWorld.getWater(loc))
            throw new GameActionException(CANT_DO_THAT, "Cannot dig on a tile that is already water.");
        if (this.gameWorld.getWall(loc))
            throw new GameActionException(CANT_DO_THAT, "Cannot dig on a tile that has a wall.");
        if (this.gameWorld.getSpawnZone(loc) != 0)
            throw new GameActionException(CANT_DO_THAT, "Cannot dig on a tile that has a spawn zone");
        if (isLocationOccupied(loc))
            throw new GameActionException(CANT_DO_THAT, "Cannot dig on a tile that has a robot on it!");
        int resources = (int) Math.round(GameConstants.DIG_COST*(1+0.01*SkillType.BUILD.getSkillEffect(this.robot.getLevel(SkillType.BUILD))));
        if (getCrumbs() < resources)
            throw new GameActionException(NOT_ENOUGH_RESOURCE, "Insufficient resources to dig.");
        if (this.gameWorld.hasFlag(loc))
            throw new GameActionException(CANT_DO_THAT, "Cannot dig under a tile with a flag currently on it.");
        if(this.robot.hasFlag())
            throw new GameActionException(CANT_DO_THAT, "Cannot dig while holding a flag");
        if (this.gameWorld.hasTrap(loc) && this.gameWorld.getTrap(loc).getTeam() == getTeam())
            throw new GameActionException(CANT_DO_THAT, "Cannot dig on a tile with one of your team's traps on it.");
    }

    @Override
    public boolean canDig(MapLocation loc) {
        try {
            assertCanDig(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void dig(MapLocation loc) throws GameActionException{
        assertCanDig(loc);
        int buildLevel = this.robot.getLevel(SkillType.BUILD);
        int cooldownIncrease = (int) Math.round(GameConstants.DIG_COOLDOWN*(1+.01*SkillType.BUILD.getCooldown(buildLevel)));
        int resources = (int) -Math.round(GameConstants.DIG_COST*(1+0.01*SkillType.BUILD.getSkillEffect(buildLevel)));
        this.robot.addActionCooldownTurns(cooldownIncrease);
        this.robot.addResourceAmount(resources);
        this.gameWorld.getMatchMaker().addAction(getID(), Action.DIG, locationToInt(loc));
        this.gameWorld.getMatchMaker().addDigLocation(loc);
        this.gameWorld.setWater(loc);

        if (this.gameWorld.hasTrap(loc) && this.gameWorld.getTrap(loc).getTeam() != getTeam() && this.gameWorld.getTrap(loc).getType() == TrapType.EXPLOSIVE){
            this.robot.addTrapTrigger(this.gameWorld.getTrap(loc), false);
        }

        this.robot.incrementSkill(SkillType.BUILD);
    }

    // *****************************
    // ****** ATTACK / HEAL ******** 
    // *****************************

    private void assertCanAttack(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.ATTACK_RADIUS_SQUARED);
        assertIsActionReady();
        InternalRobot bot = gameWorld.getRobot(loc);
        if (bot == null || bot.getTeam() == this.getTeam()) {
            throw new GameActionException(CANT_DO_THAT, "No enemy robot to attack at this location"); 
        }
        if(this.robot.hasFlag()) {
            throw new GameActionException(CANT_DO_THAT, "Can't attack while holding a flag");
        }
        if(gameWorld.isSetupPhase()) {
            throw new GameActionException(CANT_DO_THAT, "Cannot attack during setup phase");
        }
    }

    @Override
    public int getAttackDamage() {
        return this.robot.getDamage();
    }

    @Override
    public boolean canAttack(MapLocation loc) {
        try {
            assertCanAttack(loc);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override
    public void attack(MapLocation loc) throws GameActionException {
        assertCanAttack(loc);
        this.robot.addActionCooldownTurns((int) Math.round(GameConstants.ATTACK_COOLDOWN*(1+.01*SkillType.ATTACK.getCooldown(this.robot.getLevel(SkillType.ATTACK)))));
        this.robot.attack(loc);
    }

    @Override
    public int getHealAmount() {
        return this.robot.getHeal();
    }

    private void assertCanHeal(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.HEAL_RADIUS_SQUARED);
        assertIsActionReady();
        if(getLocation().equals(loc)) {
            throw new GameActionException(CANT_DO_THAT, "You can't heal yourself");
        }
        if(this.gameWorld.getRobot(loc) == null) {
            throw new GameActionException(CANT_DO_THAT, "There is no robot at this location.");
        }
        if(this.gameWorld.getRobot(loc).getTeam() != this.getTeam()) {
            throw new GameActionException(CANT_DO_THAT, "The robot at this location is the other team.");
        }
        if(this.gameWorld.getRobot(loc).getHealth() == GameConstants.DEFAULT_HEALTH) {
            throw new GameActionException(CANT_DO_THAT, "The robot at this location is at full health.");
        }
        if(this.robot.hasFlag()) {
            throw new GameActionException(CANT_DO_THAT, "Can't heal while holding a flag");
        }
    }

    @Override
    public boolean canHeal(MapLocation loc) {
        try {
            assertCanHeal(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    public void heal(MapLocation loc) throws GameActionException{
        assertCanHeal(loc);
        InternalRobot bot = this.gameWorld.getRobot(loc);
        int healAmt = this.robot.getHeal();
        this.robot.addActionCooldownTurns((int) Math.round(GameConstants.HEAL_COOLDOWN*(1+.01*SkillType.HEAL.getCooldown(this.robot.getLevel(SkillType.HEAL)))));

        bot.addHealth(healAmt);
        this.robot.incrementSkill(SkillType.HEAL);
        this.gameWorld.getMatchMaker().addAction(getID(), Action.HEAL, bot.getID());
    }

    // ***************************
    // ******* FLAG METHODS ******
    // ***************************
    
    @Override
    public boolean hasFlag(){
        return this.robot.hasFlag();
    }

    private void assertCanDropFlag(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.INTERACT_RADIUS_SQUARED);
        assertIsSpawned();
        assertIsActionReady();
        if (!robot.hasFlag())
            throw new GameActionException(CANT_DO_THAT, 
                "This robot is not holding a flag.");
        
        if(!this.gameWorld.isPassable(loc))
        throw new GameActionException(CANT_DO_THAT, 
                "A flag can't be placed at this location.");
    }

    @Override
    public boolean canDropFlag(MapLocation loc) {
        try {
            assertCanDropFlag(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void dropFlag(MapLocation loc) throws GameActionException{
        assertCanDropFlag(loc);
        Flag flag = robot.getFlag();
        this.gameWorld.addFlag(loc, flag);
        this.gameWorld.getMatchMaker().addAction(flag.getId(), Action.PLACE_FLAG, locationToInt(flag.getLoc()));
        this.robot.addActionCooldownTurns(GameConstants.PICKUP_DROP_COOLDOWN);
        robot.removeFlag();   
        this.robot.addMovementCooldownTurns();
    }

    private void assertCanPickupFlag(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.INTERACT_RADIUS_SQUARED);
        assertIsSpawned();
        assertIsActionReady();
        if(robot.hasFlag()) {
            throw new GameActionException(CANT_DO_THAT, "This robot is already holding flag.");
        }
        if(this.gameWorld.getFlags(loc).size() == 0) {
            throw new GameActionException(CANT_DO_THAT, "There aren't any flags at this location.");
        }
        Team team = getTeam();
        if (!this.gameWorld.isSetupPhase()) team = team.opponent();
        boolean validFlagTeamExists = false;
        boolean validFlagRoundsExists = false;
        for (Flag f : this.gameWorld.getFlags(loc)){
            if (f.getTeam() == team){
                validFlagTeamExists = true;
            }
            if(gameWorld.isSetupPhase() || f.getLoc() == f.getStartLoc() || f.getDroppedRounds() != 0) {
                validFlagRoundsExists = true;
            }
        }
        if (!validFlagTeamExists && gameWorld.isSetupPhase()){
            throw new GameActionException(CANT_DO_THAT, "Cannot pick up enemy team flags during setup phase");
        }
        if (!validFlagTeamExists && !gameWorld.isSetupPhase()){
            throw new GameActionException(CANT_DO_THAT, "Cannot pick up ally flags after setup phase");
        }
        if(!validFlagRoundsExists) {
            throw new GameActionException(CANT_DO_THAT, "Cannot pick up an enemy flag in the same round it was dropped");
        }
    }

    @Override
    public boolean canPickupFlag(MapLocation loc) {
        try {
            assertCanPickupFlag(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void pickupFlag(MapLocation loc) throws GameActionException {
        assertCanPickupFlag(loc);
        int idx = 0;
        Team team = getTeam();
        if (!this.gameWorld.isSetupPhase()) team = team.opponent();
        Flag tempflag = this.gameWorld.getFlags(loc).get(idx);
        while (tempflag.getTeam() != team){
            idx += 1;
            tempflag = this.gameWorld.getFlags(loc).get(idx);
        }
        this.gameWorld.removeFlag(loc, tempflag);
        robot.addFlag(tempflag);
        robot.addActionCooldownTurns(GameConstants.PICKUP_DROP_COOLDOWN);
        gameWorld.getMatchMaker().addAction(robot.getID(), Action.PICKUP_FLAG, tempflag.getId());
        this.gameWorld.getTeamInfo().pickupFlag(getTeam());

        Team[] allSpawnZones = {null, Team.A, Team.B};
        if (tempflag.getTeam() != this.robot.getTeam() && allSpawnZones[this.gameWorld.getSpawnZone(getLocation())] == this.getTeam()) {
            this.gameWorld.getTeamInfo().captureFlag(this.getTeam());
            this.gameWorld.getMatchMaker().addAction(getID(), Action.CAPTURE_FLAG, robot.getFlag().getId());
            robot.getFlag().setLoc(null);
            gameWorld.getAllFlags().remove(robot.getFlag());
            this.robot.removeFlag();
        }
    }

    // ***********************************
    // ****** COMMUNICATION METHODS ****** 
    // ***********************************

    // BOBBY TODO: method for robot to robot message (nearby)
    //             queue of incoming messages in each internal robot
    //             methods to read from queue and clear and pop and whatever
    //             method for canSendMessage (check general structure of other functions)
    //             auto format on save
    //             put on branch and make pr
    //
    //             OPTIONAL
    //             make mostly empty tower class and make functions using that too
    //             robots send message, they specify a tower, tower is basically robot thats stationary

    private void assertValidIndex(int index) throws GameActionException {
        if (index < 0 || index >= GameConstants.SHARED_ARRAY_LENGTH)
            throw new GameActionException(CANT_DO_THAT, "You can't access this index as it is not within the shared array.");
    }

    private void assertValidValue(int value) throws GameActionException {
        if (value < 0 || value > GameConstants.MAX_SHARED_ARRAY_VALUE)
            throw new GameActionException(CANT_DO_THAT, "You can't write this value to the shared array " +
                "as it is not within the range of allowable values: [0, " + GameConstants.MAX_SHARED_ARRAY_VALUE + "].");
    }

    @Override
    public int readSharedArray(int index) throws GameActionException {
        assertValidIndex(index);
        return this.gameWorld.getTeamInfo().readSharedArray(getTeam(), index);
    }

    private void assertCanWriteSharedArray(int index, int value) throws GameActionException{
        assertValidIndex(index);
        assertValidValue(value);
    }

    @Override
    public boolean canWriteSharedArray(int index, int value){
        try {
            assertCanWriteSharedArray(index, value);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override
    public void writeSharedArray(int index, int value) throws GameActionException {
        assertCanWriteSharedArray(index, value);
        this.gameWorld.getTeamInfo().writeSharedArray(getTeam(), index, value);
    }

    @Override
    public void assertCanSendMessage(MapLocation loc, Message message) throws GameActionException {
        assertNotNull(loc);
        assertCanActLocation(loc, GameConstants.MESSAGE_RADIUS_SQUARED);
        assertNotNull(this.gameWorld.getRobot(loc));
        assert(getTeam() == this.gameWorld.getRobot(loc).getTeam());
        assertNotNull(message);
        if(true) { //TODO: replace this with isRobot (as opposed to isTower)
            assert(this.robot.getSentMessagesCount() < GameConstants.MAX_MESSAGES_SENT_ROBOT);
        } else {
            assert(this.robot.getSentMessagesCount() < GameConstants.MAX_MESSAGES_SENT_TOWER);
        }
        //TODO: assert that the distance between the robots is < sqrt(20?) and they are connected by paint once that functionality is available
        //TODO: assert that robot -> tower and tower -> robot only
    }

    @Override
    public boolean canSendMessage(MapLocation loc, Message message){
        try {
            assertCanSendMessage(loc, message);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override
    public void sendMessage(MapLocation loc, int messageContent) throws GameActionException {
        Message message = new Message(messageContent, this.robot.getID(), this.gameWorld.getCurrentRound());
        assertCanSendMessage(loc, message);
        InternalRobot robot = this.gameWorld.getRobot(loc);
        this.robot.sendMessage(robot, message);
    }

    // ***********************************
    // ****** OTHER ACTION METHODS *******
    // ***********************************

    private void assertCanBuyGlobal(GlobalUpgrade ug) throws GameActionException{
        int i = -1;
        if(ug == GlobalUpgrade.ATTACK || ug == GlobalUpgrade.ACTION)
            i = 0;
        else if(ug == GlobalUpgrade.CAPTURING)
            i = 1;
        else if(ug == GlobalUpgrade.HEALING)
            i = 2;
        boolean hasBought = this.gameWorld.getTeamInfo().getGlobalUpgrades(getTeam())[i];
        if (hasBought)
           throw new GameActionException(CANT_DO_THAT, "Cannot buy an upgrade you already have!");
        if (this.gameWorld.getTeamInfo().getGlobalUpgradePoints(getTeam()) <= 0)
            throw new GameActionException(CANT_DO_THAT, "Cannot buy an upgrade with no global upgrade points!");
    }

    @Override
    public boolean canBuyGlobal(GlobalUpgrade ug){
        try{
            assertCanBuyGlobal(ug);
            return true;
        }
        catch(GameActionException e){ return false;}
    }

    @Override 
    public void buyGlobal(GlobalUpgrade ug) throws GameActionException{
        assertCanBuyGlobal(ug);
        this.gameWorld.getTeamInfo().makeGlobalUpgrade(getTeam(), ug);
        this.gameWorld.getMatchMaker().addAction(getID(), Action.GLOBAL_UPGRADE, FlatHelpers.getGlobalUpgradeTypeFromGlobalUpgrade(ug));
    }

    @Override
    public GlobalUpgrade[] getGlobalUpgrades(Team team) {
        boolean[] boolUpgrades = this.gameWorld.getTeamInfo().getGlobalUpgrades(team);
        ArrayList<GlobalUpgrade> upgrades = new ArrayList<>();
        if(boolUpgrades[0]) upgrades.add(GlobalUpgrade.ATTACK);
        if(boolUpgrades[1]) upgrades.add(GlobalUpgrade.CAPTURING);
        if(boolUpgrades[2]) upgrades.add(GlobalUpgrade.HEALING);
        return upgrades.toArray(new GlobalUpgrade[upgrades.size()]);
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
    public void setIndicatorDot(MapLocation loc, int red, int green, int blue) {
        assertNotNull(loc);
        this.gameWorld.getMatchMaker().addIndicatorDot(getID(), loc, red, green, blue);
    }

    @Override
    public void setIndicatorLine(MapLocation startLoc, MapLocation endLoc, int red, int green, int blue) {
        assertNotNull(startLoc);
        assertNotNull(endLoc);
        this.gameWorld.getMatchMaker().addIndicatorLine(getID(), startLoc, endLoc, red, green, blue);
    }
}
