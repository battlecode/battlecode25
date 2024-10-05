package battlecode.world;

import battlecode.common.*;
import battlecode.instrumenter.profiler.ProfilerCollection;
import battlecode.schema.Action;
import battlecode.server.ErrorReporter;
import battlecode.server.GameMaker;
import battlecode.server.GameState;
import battlecode.util.FlatHelpers;
import battlecode.world.control.RobotControlProvider;

import java.util.*;

/**
 * The primary implementation of the GameWorld interface for containing and
 * modifying the game map and the objects on it.
 */
public strictfp class GameWorld {
    /**
     * The current round we're running.
     */
    protected int currentRound;

    /**
     * Whether we're running.
     */
    protected boolean running = true;

    protected final IDGenerator idGenerator;
    protected final GameStats gameStats;
    private boolean[] walls;
    private boolean[] water;
    private boolean[] dams;
    private int[] spawnZones; // Team A = 1, Team B = 2, not spawn zone = 0
    private int[] teamSides; //Team A territory = 1, Team B territory = 2, dam = 0
    private MapLocation[][] spawnLocations;
    private int[] breadAmounts;
    private ArrayList<Trap>[] trapTriggers;
    private Trap[] trapLocations;
    private int trapId;
    private InternalRobot[][] robots;
    private final LiveMap gameMap;
    private final TeamInfo teamInfo;
    private final ObjectInfo objectInfo;
    
    //List of all flags, not indexed by location
    private ArrayList<Flag> allFlags;
    //List of flags on each tile, indexed by location
    private ArrayList<Flag>[] placedFlags;


    private Map<Team, ProfilerCollection> profilerCollections;

    private final RobotControlProvider controlProvider;
    private Random rand;
    private final GameMaker.MatchMaker matchMaker;

    @SuppressWarnings("unchecked")
    public GameWorld(LiveMap gm, RobotControlProvider cp, GameMaker.MatchMaker matchMaker) {
        this.walls = gm.getWallArray();
        this.water = gm.getWaterArray();
        this.spawnZones = gm.getSpawnZoneArray();
        this.dams = gm.getDamArray();
        this.breadAmounts = gm.getBreadArray();
        this.robots = new InternalRobot[gm.getWidth()][gm.getHeight()]; // if represented in cartesian, should be height-width, but this should allow us to index x-y
        this.currentRound = 0;
        this.trapId = 0;
        this.idGenerator = new IDGenerator(gm.getSeed());
        this.gameStats = new GameStats();
        this.gameMap = gm;
        this.objectInfo = new ObjectInfo(gm);
        teamSides = new int[gameMap.getWidth() * gameMap.getHeight()];

        this.profilerCollections = new HashMap<>();

        this.controlProvider = cp;
        this.rand = new Random(this.gameMap.getSeed());
        this.matchMaker = matchMaker;

        this.controlProvider.matchStarted(this);

        this.teamInfo = new TeamInfo(this);

        // Create all robots in their despawned states
        for (int i = 0; i < GameConstants.ROBOT_CAPACITY; i++) {
            createRobot(Team.A);
            createRobot(Team.B);
        }


        // Write match header at beginning of match
        this.matchMaker.makeMatchHeader(this.gameMap);

        this.trapLocations = new Trap[gm.getWidth()*gm.getHeight()];

        this.trapTriggers = new ArrayList[gm.getWidth()*gm.getHeight()];
        for (int i = 0; i < trapTriggers.length; i++){
            this.trapTriggers[i] = new ArrayList<Trap>();
        }


        //initialize flags
        this.allFlags = new ArrayList<Flag>();
        this.placedFlags = new ArrayList[gm.getWidth() * gm.getHeight()];

        for (int i = 0; i < placedFlags.length; i++)
            placedFlags[i] = new ArrayList<>();
        
        int[] flagArray = new int[this.walls.length];
        int[][] spawnZoneCenters = gm.getSpawnZoneCenters();
        for (int i = 0; i < spawnZoneCenters[0].length; i++){
            MapLocation cur = new MapLocation(spawnZoneCenters[0][i], spawnZoneCenters[1][i]);
            if (i % 2 == 0){
                flagArray[locationToIndex(cur)] = 1;
            }
            else{
                flagArray[locationToIndex(cur)] = 2;
            }
        }
        for (int i = 0; i < flagArray.length; i++) {
            int flagVal = flagArray[i];
            if(flagVal == 0) continue;
            Flag flag = new Flag(flagVal == 1 ? Team.A : Team.B, indexToLocation(i), i);
            allFlags.add(flag);
            placedFlags[i].add(flag);
        }
      
        this.spawnLocations = new MapLocation[2][9*GameConstants.NUMBER_FLAGS];
        int curA = 0, curB = 0;
        for (int i = 0; i < gm.getHeight()*gm.getWidth(); i++){
            if (this.spawnZones[i] == 1){
                this.spawnLocations[0][curA] = indexToLocation(i);
                curA += 1;
            }
            else if (this.spawnZones[i] == 2){
                this.spawnLocations[1][curB] = indexToLocation(i);
                curB += 1;
            }
        }

        for(Flag flag : allFlags) {
            floodFillTeam(flag.getTeam() == Team.A ? 1 : 2, flag.getLoc());
        }
    }

    /**
     * Run a single round of the game.
     *
     * @return the state of the game after the round has run
     */
    public synchronized GameState runRound() {
        if (!this.isRunning()) {
            List<ProfilerCollection> profilers = new ArrayList<>(2);
            if (!profilerCollections.isEmpty()) {
                profilers.add(profilerCollections.get(Team.A));
                profilers.add(profilerCollections.get(Team.B));
            }

            // Write match footer if game is done
            matchMaker.makeMatchFooter(gameStats.getWinner(), gameStats.getDominationFactor(), currentRound, profilers);
            return GameState.DONE;
        }

        try {
            this.processBeginningOfRound();
            this.controlProvider.roundStarted();
            // On the first round we want to add the initial amounts to the headquarters
            if (this.currentRound == 1) {
                this.teamInfo.addBread(Team.A, GameConstants.INITIAL_CRUMBS_AMOUNT);
                this.teamInfo.addBread(Team.B, GameConstants.INITIAL_CRUMBS_AMOUNT);
            }

            updateDynamicBodies();

            this.controlProvider.roundEnded();
            this.teamInfo.addBread(Team.A, GameConstants.PASSIVE_CRUMBS_INCREASE);
            this.teamInfo.addBread(Team.B, GameConstants.PASSIVE_CRUMBS_INCREASE);
            this.processEndOfRound();

            if (!this.isRunning()) {
                this.controlProvider.matchEnded();
            }

        } catch (Exception e) {
            ErrorReporter.report(e);
            // TODO throw out file?
            return GameState.DONE;
        }
        // Write out round data
        matchMaker.makeRound(currentRound);
        return GameState.RUNNING;
    }

    private void updateDynamicBodies() {
        objectInfo.eachDynamicBodyByExecOrder((body) -> {
            if (body instanceof InternalRobot) {
                return updateRobot((InternalRobot) body);
            } else {
                throw new RuntimeException("non-robot body registered as dynamic");
            }
        });
    }

    private boolean updateRobot(InternalRobot robot) {
        robot.processBeginningOfTurn();
        this.controlProvider.runRobot(robot);
        robot.setBytecodesUsed(this.controlProvider.getBytecodesUsed(robot));
        robot.processEndOfTurn();

        // If the robot terminates but the death signal has not yet
        // been visited:

        if (this.controlProvider.getTerminated(robot) && objectInfo.getRobotByID(robot.getID()) != null
            && robot.getLocation() != null)
        {
            destroyRobot(robot.getID());
        }

        return true;
    }

    // *********************************
    // ****** BASIC MAP METHODS ********
    // *********************************

    public int getMapSeed() {
        return this.gameMap.getSeed();
    }

    public LiveMap getGameMap() {
        return this.gameMap;
    }

    public TeamInfo getTeamInfo() {
        return this.teamInfo;
    }

    public GameStats getGameStats() {
        return this.gameStats;
    }

    public ObjectInfo getObjectInfo() {
        return this.objectInfo;
    }

    public GameMaker.MatchMaker getMatchMaker() {
        return this.matchMaker;
    }

    public Team getWinner() {
        return this.gameStats.getWinner();
    }

    public boolean isRunning() {
        return this.running;
    }

    public int getCurrentRound() {
        return this.currentRound;
    }

    public boolean getWall(MapLocation loc) {
        return this.walls[locationToIndex(loc)];
    }

    public boolean getWater(MapLocation loc) {
        return this.water[locationToIndex(loc)];
    }

    public void setWater(MapLocation loc) {
        this.water[locationToIndex(loc)] = true;
    }

    public void setLand(MapLocation loc) {
        this.water[locationToIndex(loc)] = false;
    }

    public int getBreadAmount(MapLocation loc) {
        return this.breadAmounts[locationToIndex(loc)];
    }

    public void removeBread(MapLocation loc) {
        this.breadAmounts[locationToIndex(loc)] = 0;
    }

    /**
     * Checks if a given location is a spawn zone.
     * Returns 0 if not, 1 if it is a Team A spawn zone,
     * and 2 if it is a Team B spawn zone.
     * 
     * @param loc the location to check
     * @return 0 if the location is not a spawn zone,
     * 1 or 2 if it is a Team A or Team B spawn zone respectively
     */
    public int getSpawnZone(MapLocation loc) {
        return this.spawnZones[locationToIndex(loc)];
    }

    public int getTeamSide(MapLocation loc) {
        return teamSides[locationToIndex(loc)];
    }

    public boolean isPassable(MapLocation loc) {
        if (currentRound <= GameConstants.SETUP_ROUNDS){
            return !this.walls[locationToIndex(loc)] && !this.water[locationToIndex(loc)] && !this.dams[locationToIndex(loc)];
        }
        return !this.walls[locationToIndex(loc)] && !this.water[locationToIndex(loc)];
    }

    public ArrayList<Flag> getAllFlags() {
        return allFlags;
    }

    public void addFlag(MapLocation loc, Flag flag) {
        placedFlags[locationToIndex(loc)].add(flag);
        flag.setLoc(loc);
    }

    public ArrayList<Flag> getFlags(MapLocation loc) {
        return placedFlags[locationToIndex(loc)];
    }

    public void removeFlag(MapLocation loc, Flag flag){
        placedFlags[locationToIndex(loc)].remove(flag);
    }

    public boolean hasFlag(MapLocation loc) {
        return placedFlags[locationToIndex(loc)].size() > 0;
    }

    /**
     * Helper method that converts a location into an index.
     * 
     * @param loc the MapLocation
     */
    public int locationToIndex(MapLocation loc) {
        return this.gameMap.locationToIndex(loc);
    }

    /**
     * Helper method that converts an index into a location.
     * 
     * @param idx the index
     */
    public MapLocation indexToLocation(int idx) {
        return gameMap.indexToLocation(idx);
    }

    // ***********************************
    // ****** DAM METHODS **************
    // ***********************************

    public boolean getDam(MapLocation loc){
        if (currentRound <= GameConstants.SETUP_ROUNDS){
            return dams[locationToIndex(loc)];
        }
        else {
            return false;
        }
    }

    // ***********************************
    // ****** TRAP METHODS **************
    // ***********************************
    
    public Trap getTrap(MapLocation loc) {
        return this.trapLocations[locationToIndex(loc)];
    }

    public boolean hasTrap(MapLocation loc){
        return (this.trapLocations[locationToIndex(loc)] != null);
    }

    public ArrayList<Trap> getTrapTriggers(MapLocation loc) {
        return this.trapTriggers[locationToIndex(loc)];
    }

    public void placeTrap(MapLocation loc, TrapType type, Team team){
        Trap trap = new Trap(loc, type, team, trapId);
        trapId++;
        matchMaker.addTrap(trap);
        this.trapLocations[locationToIndex(loc)] = trap;
        for (MapLocation adjLoc : getAllLocationsWithinRadiusSquared(loc, trap.getType().triggerRadius)){
            this.trapTriggers[locationToIndex(adjLoc)].add(trap);
        }
    }

    public void triggerTrap(Trap trap, InternalRobot robot, boolean entered){
        MapLocation loc = trap.getLocation();
        TrapType type = trap.getType();
        switch(type){
            case STUN:
                for (InternalRobot rob : getAllRobotsWithinRadiusSquared(loc, type.enterRadius, trap.getTeam().opponent())){
                    rob.setMovementCooldownTurns(type.opponentCooldown);
                    rob.setActionCooldownTurns(type.opponentCooldown);
                }
                break;
            case EXPLOSIVE:
                int rad = type.interactRadius;
                int dmg = type.interactDamage;
                if (entered){
                    rad = type.enterRadius;
                    dmg = type.enterDamage;
                }
                for (InternalRobot rob : getAllRobotsWithinRadiusSquared(loc, rad, trap.getTeam().opponent())){
                    rob.addHealth(-1*dmg);
                }
                break;
            case WATER:
                for (MapLocation adjLoc : getAllLocationsWithinRadiusSquared(loc, type.enterRadius)){
                    if (getRobot(adjLoc) != null || !isPassable(adjLoc) || getSpawnZone(adjLoc) != 0 || getTrap(adjLoc) != null)
                        continue;
                    setWater(adjLoc);
                    matchMaker.addAction(-1, Action.DIG, locationToIndex(adjLoc));
                }
                break;
        }
        for (MapLocation adjLoc : getAllLocationsWithinRadiusSquared(loc, 2)){
            this.trapTriggers[locationToIndex(adjLoc)].remove(trap);
        }
        this.trapLocations[locationToIndex(loc)] = null;
        matchMaker.addTriggeredTrap(trap.getId());
        matchMaker.addAction(robot.getID(), FlatHelpers.getTrapActionFromTrapType(type), locationToIndex(trap.getLocation()));
    }

    // ***********************************
    // ****** ROBOT METHODS **************
    // ***********************************

    public InternalRobot getRobot(MapLocation loc) {
        return this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y];
    }

    public void moveRobot(MapLocation start, MapLocation end) {
        addRobot(end, getRobot(start));
        removeRobot(start);
    }

    public void addRobot(MapLocation loc, InternalRobot robot) {
        this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y] = robot;
    }

    public void removeRobot(MapLocation loc) {
        this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y] = null;
    }

    public InternalRobot[] getAllRobotsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        return getAllRobotsWithinRadiusSquared(center, radiusSquared, null);
    }

    public InternalRobot[] getAllRobotsWithinRadiusSquared(MapLocation center, int radiusSquared, Team team) {
        ArrayList<InternalRobot> returnRobots = new ArrayList<InternalRobot>();
        for (MapLocation newLocation : getAllLocationsWithinRadiusSquared(center, radiusSquared))
            if (getRobot(newLocation) != null) {
                if (team == null || getRobot(newLocation).getTeam() == team)
                    returnRobots.add(getRobot(newLocation));
            }
        return returnRobots.toArray(new InternalRobot[returnRobots.size()]);
    }

    public InternalRobot[] getAllRobots(Team team) {
        ArrayList<InternalRobot> returnRobots = new ArrayList<InternalRobot>();
        for (MapLocation newLocation : getAllLocations()){
            if (getRobot(newLocation) != null && (team == null || getRobot(newLocation).getTeam() == team)){
            returnRobots.add(getRobot(newLocation));
            }
        }
        return returnRobots.toArray(new InternalRobot[returnRobots.size()]);
    }

    public Flag[] getAllFlagsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<Flag> returnFlags = new ArrayList<Flag>();
        for (MapLocation newLocation : getAllLocationsWithinRadiusSquared(center, radiusSquared))
            if (getFlags(newLocation) != null)
                returnFlags.addAll(getFlags(newLocation));
        return returnFlags.toArray(new Flag[returnFlags.size()]);
    }

    public MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        return getAllLocationsWithinRadiusSquaredWithoutMap(
            this.gameMap.getOrigin(),
            this.gameMap.getWidth(),
            this.gameMap.getHeight(),
            center, radiusSquared
        );
    }

    public static MapLocation[] getAllLocationsWithinRadiusSquaredWithoutMap(MapLocation origin,
                                                                            int width, int height,
                                                                            MapLocation center, int radiusSquared) {
        ArrayList<MapLocation> returnLocations = new ArrayList<MapLocation>();
        int ceiledRadius = (int) Math.ceil(Math.sqrt(radiusSquared)) + 1; // add +1 just to be safe
        int minX = Math.max(center.x - ceiledRadius, origin.x);
        int minY = Math.max(center.y - ceiledRadius, origin.y);
        int maxX = Math.min(center.x + ceiledRadius, origin.x + width - 1);
        int maxY = Math.min(center.y + ceiledRadius, origin.y + height - 1);
        for (int x = minX; x <= maxX; x++) {
            for (int y = minY; y <= maxY; y++) {
                MapLocation newLocation = new MapLocation(x, y);
                if (center.isWithinDistanceSquared(newLocation, radiusSquared))
                    returnLocations.add(newLocation);
            }
        }
        return returnLocations.toArray(new MapLocation[returnLocations.size()]);
    }

    /**
     * @return all of the locations on the grid
     */
    private MapLocation[] getAllLocations() {
        return getAllLocationsWithinRadiusSquared(new MapLocation(0, 0), Integer.MAX_VALUE);
    }

    public MapLocation[] getSpawnLocations(Team team){
        return this.spawnLocations[team.ordinal()];
    }

    // *********************************
    // ****** GAMEPLAY *****************
    // *********************************

    public void processBeginningOfRound() {
        //Update flag broadcast locations after a certain number of rounds
        if(currentRound % GameConstants.FLAG_BROADCAST_UPDATE_INTERVAL == 0) updateFlagBroadcastLocations();
        currentRound++;
        if(currentRound != 0 && currentRound % GameConstants.GLOBAL_UPGRADE_ROUNDS == 0) {
            teamInfo.incrementGlobalUpgradePoints(Team.A);
            teamInfo.incrementGlobalUpgradePoints(Team.B);
        }

        // Process beginning of each robot's round
        objectInfo.eachRobot((robot) -> {
            robot.processBeginningOfRound();
            return true;
        });
    }

    private void updateFlagBroadcastLocations() {
        for(Flag flag : allFlags) {
            updateFlagBroadcastLocation(flag);
        }
    }

    private void updateFlagBroadcastLocation(Flag flag) {
        MapLocation[] nearLocs = getAllLocationsWithinRadiusSquared(flag.getLoc(), GameConstants.FLAG_BROADCAST_NOISE_RADIUS);
        flag.setBroadcastLoc(nearLocs[rand.nextInt(nearLocs.length)]);
    }

    public void setWinner(Team t, DominationFactor d) {
        gameStats.setWinner(t);
        gameStats.setDominationFactor(d);
    }

    /**
     * @return whether a team has more flags
     */
    public boolean setWinnerIfMoreFlags(){
        int[] totalFlagsCaptured = new int[2];

        // consider team reserves
        totalFlagsCaptured[Team.A.ordinal()] += this.teamInfo.getFlagsCaptured(Team.A);
        totalFlagsCaptured[Team.B.ordinal()] += this.teamInfo.getFlagsCaptured(Team.B);
        
        if (totalFlagsCaptured[Team.A.ordinal()] > totalFlagsCaptured[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_FLAG_CAPTURES);
            return true;
        } else if (totalFlagsCaptured[Team.B.ordinal()] > totalFlagsCaptured[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_FLAG_CAPTURES);
            return true;
        }
        return false;
    }

    /**
     * @return whether a team has a higher total robot level
     */
    public boolean setWinnerIfGreaterLevelSum() {
        int sumA = teamInfo.getLevelSum(Team.A), sumB = teamInfo.getLevelSum(Team.B);
        if(sumA > sumB) {
            setWinner(Team.A, DominationFactor.LEVEL_SUM);
            return true;
        }
        else if(sumB > sumA) {
            setWinner(Team.B, DominationFactor.LEVEL_SUM);
            return true;
        }
        return false;
    }

    /**
     * @return whether a team has more bread
     */
    public boolean setWinnerIfMoreBread(){
        int[] totalBreadValues = new int[2];

        // consider team reserves
        totalBreadValues[Team.A.ordinal()] += this.teamInfo.getBread(Team.A);
        totalBreadValues[Team.B.ordinal()] += this.teamInfo.getBread(Team.B);
        
        if (totalBreadValues[Team.A.ordinal()] > totalBreadValues[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_BREAD);
            return true;
        } else if (totalBreadValues[Team.B.ordinal()] > totalBreadValues[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_BREAD);
            return true;
        }
        return false;
    }

    /**
     * @return whether a team has more flags picked up (but not sucessfully retrieved)
     */
    public boolean setWinnerIfMoreFlagsPickedUp(){
        int[] totalFlagsPickedUp = new int[2];

        // consider team reserves
        totalFlagsPickedUp[Team.A.ordinal()] += this.teamInfo.getFlagsPickedUp(Team.A);
        totalFlagsPickedUp[Team.B.ordinal()] += this.teamInfo.getFlagsPickedUp(Team.B);
        
        if (totalFlagsPickedUp[Team.A.ordinal()] > totalFlagsPickedUp[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_FLAGS_PICKED);
            return true;
        } else if (totalFlagsPickedUp[Team.B.ordinal()] > totalFlagsPickedUp[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_FLAGS_PICKED);
            return true;
        }
        return false;
    }

    /**
     * Sets a winner arbitrarily. Hopefully this is actually random.
     */
    public void setWinnerArbitrary() {
        setWinner(Math.random() < 0.5 ? Team.A : Team.B, DominationFactor.WON_BY_DUBIOUS_REASONS);
    }

    public boolean timeLimitReached() {
        return currentRound >= this.gameMap.getRounds();
    }

    /**
     * Checks end of match and then decides winner based on tiebreak conditions
     */
    public void checkEndOfMatch() {
        if (timeLimitReached() && gameStats.getWinner() == null) {
            if (setWinnerIfMoreFlags()) return;
            if (setWinnerIfGreaterLevelSum()) return;
            if (setWinnerIfMoreBread()) return;
            setWinnerArbitrary();
        }
    }

    public void processEndOfRound() {

        if(currentRound == GameConstants.SETUP_ROUNDS) processEndOfSetupPhase();

        //Reset dropped flags if necessary
        if (!isSetupPhase()) {
            for(Flag flag : allFlags) {
                if(!flag.isPickedUp() && flag.getLoc() != flag.getStartLoc()){ 
                    Team this_team = flag.getTeam();
                    Team opponent_team = this_team.opponent();
                    int additional_delay = 0;
                    
                    //check if the opponent team has the additional flag return delay upgrade
                    if(this.teamInfo.getGlobalUpgrades(opponent_team)[1]){
                        additional_delay = GlobalUpgrade.CAPTURING.flagReturnDelayChange;
                    }
                    
                    if(flag.getDroppedRounds() >= GameConstants.FLAG_DROPPED_RESET_ROUNDS + additional_delay)
                        moveFlagSetStartLoc(flag, flag.getStartLoc());
                    else
                        flag.incrementDroppedRounds();
                }
            }
        }

        this.matchMaker.addTeamInfo(Team.A, this.teamInfo.getBread(Team.A), this.teamInfo.getSharedArray(Team.A));
        this.matchMaker.addTeamInfo(Team.B, this.teamInfo.getBread(Team.B), this.teamInfo.getSharedArray(Team.B));
        this.teamInfo.processEndOfRound();

        objectInfo.eachRobot((robot) -> {
            matchMaker.addRobot(robot);
            return true;
        });

        checkEndOfMatch();

        if (gameStats.getWinner() != null)
            running = false;
    }

    private void processEndOfSetupPhase() {
        ArrayList<Flag> teamAFlags = new ArrayList<>();
        ArrayList<Flag> teamBFlags = new ArrayList<>();
        for (Flag flag : allFlags) {
            if(flag.getTeam() == Team.A) teamAFlags.add(flag);
            else teamBFlags.add(flag);
        }
        confirmFlagPlacements(teamAFlags);
        confirmFlagPlacements(teamBFlags);
    }

    private void confirmFlagPlacements(ArrayList<Flag> teamFlags) {
        boolean validPlacements = true;
        for(int i = 0; i < teamFlags.size(); i++){
            for(int j = i + 1; j < teamFlags.size(); j++){
                Flag a = teamFlags.get(i), b = teamFlags.get(j);
                if(a.getLoc().distanceSquaredTo(b.getLoc()) < GameConstants.MIN_FLAG_SPACING_SQUARED) {
                    validPlacements = false;
                    break;
                }
            }
        }
        if(validPlacements)
            for(Flag flag : teamFlags) moveFlagSetStartLoc(flag, flag.getLoc());
        else
            for(Flag flag : teamFlags) moveFlagSetStartLoc(flag, flag.getStartLoc());
    }

    private void moveFlagSetStartLoc(Flag flag, MapLocation location){
        if(flag.isPickedUp()) flag.getCarryingRobot().removeFlag();
        removeFlag(flag.getLoc(), flag);
        addFlag(location, flag);
        matchMaker.addAction(flag.getId(), Action.PLACE_FLAG, locationToIndex(location));
        flag.setStartLoc(location);
    }

    private void floodFillTeam(int teamVal, MapLocation start) {
        Queue<MapLocation> queue = new LinkedList<MapLocation>();
        queue.add(start);

        while (!queue.isEmpty()) {
            MapLocation loc = queue.remove();
            int idx = locationToIndex(loc);

            if(teamSides[idx] != 0) continue;
            teamSides[idx] = teamVal;

            for (Direction dir : Direction.allDirections()) {
                if (dir != Direction.CENTER) {
                    MapLocation newLoc = loc.add(dir);

                    if (gameMap.onTheMap(newLoc)) {
                        int newIdx = locationToIndex(newLoc);
                        if (teamSides[newIdx] == 0 && !walls[newIdx] && !dams[newIdx]) {
                            queue.add(newLoc);
                        }
                    }
                }
            }
        }
    }
    
    // *********************************
    // ****** SPAWNING *****************
    // *********************************

    public int createRobot(int ID, Team team) {
        InternalRobot robot = new InternalRobot(this, ID, team);
        objectInfo.createRobot(robot);
        controlProvider.robotSpawned(robot);
        return ID;
    }

    public int createRobot(Team team) {
        int ID = idGenerator.nextID();
        return createRobot(ID, team);
    }

    // *********************************
    // ****** DESTROYING ***************
    // *********************************

    // public void despawnRobot(int id) {
    //     InternalRobot robot = objectInfo.getRobotByID(id);
    //     removeRobot(robot.getLocation());
    //     robot.despawn();
    //     matchMaker.addDied(id);
    // }

    /**
     * Permanently destroy a robot; left for internal purposes.
     */
    public void destroyRobot(int id) {
        InternalRobot robot = objectInfo.getRobotByID(id);
        
        if (robot.getLocation() != null)
        {
            removeRobot(robot.getLocation());
        }

        controlProvider.robotKilled(robot);
        objectInfo.destroyRobot(id);
        matchMaker.addDied(id);
    }

    // *********************************
    // ********* PROFILER **************
    // *********************************

    public void setProfilerCollection(Team team, ProfilerCollection profilerCollection) {
        if (profilerCollections == null) {
            profilerCollections = new HashMap<>();
        }
        profilerCollections.put(team, profilerCollection);
    }
    
    public boolean isSetupPhase() {
        return currentRound <= GameConstants.SETUP_ROUNDS;
    }
    
}
