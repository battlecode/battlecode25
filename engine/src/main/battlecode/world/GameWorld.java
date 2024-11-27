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
    private int[] colorLocations; // No color = 0, Team A color 1 = 1, Team A color 2 = 2, Team B color 1 = 3, Team B color 2 = 4
    private InternalRobot[][] robots;
    private final LiveMap gameMap;
    private final TeamInfo teamInfo;
    private final ObjectInfo objectInfo;

    private final static int RESOURCE_INDEX = 0, DEFENSE_INDEX = 1, MONEY_INDEX = 2, PAINT_INDEX = 3;
    private int[] patternArray; // 0 = resource pattern, 1 = defense tower, 2 = money tower, 3 = paint tower


    private ArrayList<MapLocation> resourcePatternCenters;
    private Team[] resourcePatternCentersByLoc;
    private ArrayList<MapLocation> towerLocations;
    private Team[] towersByLoc; // indexed by location

    // List of all ruins, not indexed by location
    private ArrayList<MapLocation> allRuins;
    // Whether there is a ruin on each tile, indexed by location
    private boolean[] allRuinsByLoc;

    private Map<Team, ProfilerCollection> profilerCollections;

    private final RobotControlProvider controlProvider;
    private Random rand;
    private final GameMaker.MatchMaker matchMaker;

    @SuppressWarnings("unchecked")
    public GameWorld(LiveMap gm, RobotControlProvider cp, GameMaker.MatchMaker matchMaker) {
        int width = gm.getWidth();
        int height = gm.getHeight();
        int numSquares = width * height;

        this.walls = gm.getWallArray();
        this.robots = new InternalRobot[width][height]; // if represented in cartesian, should be height-width, but this should allow us to index x-y
        this.currentRound = 0;
        this.idGenerator = new IDGenerator(gm.getSeed());
        this.gameStats = new GameStats();
        this.gameMap = gm;
        this.objectInfo = new ObjectInfo(gm);
        this.colorLocations = new int[gameMap.getWidth() * gameMap.getHeight()];

        this.profilerCollections = new HashMap<>();

        this.controlProvider = cp;
        this.rand = new Random(this.gameMap.getSeed());
        this.matchMaker = matchMaker;

        this.controlProvider.matchStarted(this);

        this.teamInfo = new TeamInfo(this);

        // Write match header at beginning of match
        this.matchMaker.makeMatchHeader(this.gameMap);

        this.patternArray = gm.getPatternArray();
        this.resourcePatternCenters = new ArrayList<MapLocation>();
        this.resourcePatternCentersByLoc = new Team[numSquares];

        for (int i = 0; i < numSquares; i++) {
            this.resourcePatternCentersByLoc[i] = Team.NEUTRAL;
        }

        this.allRuinsByLoc = gm.getRuinArray();
        this.allRuins = new ArrayList<MapLocation>();
        for (int i = 0; i < numSquares; i++){
            if (this.allRuinsByLoc[i]){
                this.allRuins.add(indexToLocation(i));
            }
        }

        for (MapLocation ruin : this.allRuins){
            this.allRuinsByLoc[locationToIndex(ruin)] = true;
        }
      
        RobotInfo[] initialBodies = gm.getInitialBodies(); 
        this.towerLocations = new ArrayList<MapLocation>();
        this.towersByLoc = new Team[numSquares]; //idk if both of these are used but I instantiated for now
        for (int i = 0; i < numSquares; i++){
            towersByLoc[i] = Team.NEUTRAL;  
        }
        for (int i = 0; i < initialBodies.length; i++) {
            RobotInfo robot = initialBodies[i];
            MapLocation newLocation = robot.location.translate(gm.getOrigin().x, gm.getOrigin().y);
            spawnRobot(robot.ID, robot.type, newLocation, robot.team);
            this.towerLocations.add(newLocation);
            towersByLoc[locationToIndex(newLocation)] = robot.team;
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
            
            updateResourcePatterns();
            updateDynamicBodies();

            this.controlProvider.roundEnded();
            this.processEndOfRound();

            if (!this.isRunning()) {
                this.controlProvider.matchEnded();
            }
        } catch (Exception e) {
            ErrorReporter.report(e);
            // TODO throw out file?
            return GameState.DONE;
        }
        //todo: should I end the round here or in processEndofRound?
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

    private void updateResourcePatterns() {
        for (MapLocation center : resourcePatternCenters) {
            Team team = resourcePatternCentersByLoc[locationToIndex(center)];
            boolean stillActive = checkResourcePattern(team, center);

            if (!stillActive) {
                resourcePatternCenters.remove(center);
                resourcePatternCentersByLoc[locationToIndex(center)] = Team.NEUTRAL;
            }
        }
    }

    public int getResourcePatternBit(int dx, int dy) {
        return getPatternBit(this.patternArray[RESOURCE_INDEX], dx, dy);
    }

    public int getTowerPatternBit(int dx, int dy, UnitType towerType) {
        return getPatternBit(this.patternArray[towerTypeToPatternIndex(towerType)], dx, dy);
    }

    public int getPatternBit(int pattern, int dx, int dy) {
        int bitNum = GameConstants.PATTERN_SIZE * (dx + GameConstants.PATTERN_SIZE / 2)
                        + dy + GameConstants.PATTERN_SIZE / 2;
        int bit = (pattern >> bitNum) & 1;
        return bit;
    }

    public boolean checkResourcePattern(Team team, MapLocation center) {
        return checkPattern(this.patternArray[RESOURCE_INDEX], team, center);
    }

    public boolean checkTowerPattern(Team team, MapLocation center, UnitType towerType) {
        return checkPattern(this.patternArray[towerTypeToPatternIndex(towerType)], team, center);
    }

    public boolean checkPattern(int pattern, Team team, MapLocation center) {
        int primary = getPrimaryPaint(team);
        int secondary = getSecondaryPaint(team);
        boolean[] possibleSymmetries = new boolean[8];
        int numRemainingSymmetries = 8;

        for (int dx = -GameConstants.PATTERN_SIZE / 2; dx < (GameConstants.PATTERN_SIZE + 1) / 2; dx++) {
            for (int dy = -GameConstants.PATTERN_SIZE / 2; dy < (GameConstants.PATTERN_SIZE + 1) / 2; dy++) {
                for (int sym = 0; sym < 8; sym++) {
                    if (possibleSymmetries[sym]) {
                        int dx2;
                        int dy2;

                        switch (sym) {
                            case 0:
                                dx2 = dx;
                                dy2 = dy;
                                break;
                            case 1:
                                dx2 = -dy;
                                dy2 = dx;
                                break;
                            case 2:
                                dx2 = -dx;
                                dy2 = -dy;
                                break;
                            case 3:
                                dx2 = dy;
                                dy2 = -dx;
                                break;
                            case 4:
                                dx2 = -dx;
                                dy2 = dy;
                                break;
                            case 5:
                                dx2 = dy;
                                dy2 = dx;
                                break;
                            case 6:
                                dx2 = dx;
                                dy2 = -dy;
                                break;
                            case 7:
                                dx2 = -dy;
                                dy2 = -dx;
                                break;
                            default:
                                dx2 = 0;
                                dy2 = 0;
                                break;
                        }

                        int paint = getPaint(center.translate(dx2, dy2));
                        int bit = getPatternBit(pattern, dx2, dy2);

                        if (paint != (bit == 1 ? primary : secondary)) {
                            possibleSymmetries[sym] = false;
                            numRemainingSymmetries -= 1;
                        }
                    }
                }

                if (numRemainingSymmetries == 0) {
                    return false;
                }
            }
        }

        return true;
    }

    public void completeTowerPattern(Team team, UnitType type, MapLocation center) {
        this.towerLocations.add(center);
        this.towersByLoc[locationToIndex(center)] = team;
        InternalRobot unit = new InternalRobot(this, idGenerator.nextID(), team, type);
        addRobot(center, unit);
    }

    public void completeResourcePattern(Team team, MapLocation center) {
        int idx = locationToIndex(center);

        if (this.resourcePatternCentersByLoc[idx] == Team.NEUTRAL) {
            this.resourcePatternCenters.add(center);
        }

        this.resourcePatternCentersByLoc[idx] = team;
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

    public int getPaint(MapLocation loc) {
        return this.colorLocations[locationToIndex(loc)];
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

    public void setPaint(MapLocation loc, int paint) {
        if (teamFromPaint(this.colorLocations[locationToIndex(loc)]) != Team.NEUTRAL){
        this.getTeamInfo().addPaintedSquares(-1, teamFromPaint(this.colorLocations[locationToIndex(loc)]));
        }
        if (teamFromPaint(paint) != Team.NEUTRAL){
        this.getTeamInfo().addPaintedSquares(1, teamFromPaint(paint));
        }
        this.colorLocations[locationToIndex(loc)] = paint;
    }

    public boolean hasTower(MapLocation loc) {
        return this.towersByLoc[locationToIndex(loc)] != Team.NEUTRAL;
    }

    public boolean hasTower(Team team, MapLocation loc) {
        return this.towersByLoc[locationToIndex(loc)] == team;
    }

    /**
     * Checks if a given location has a tower.
     * Returns the team of the tower if a tower exists,
     * and {@value Team#NEUTRAL} if not.
     * 
     * @param loc the location to check
     * @return the team of the tower at this location
     */
    public Team getTowerTeam(MapLocation loc) {
        return this.towersByLoc[locationToIndex(loc)];
    }

    /**
     * Returns the resource pattern corresponding to the map,
     * stored as the bits of an int between 0 and 2^({@value GameConstants#PATTERN_SIZE}^2) - 1.
     * The bit at (a, b) (zero-indexed) in the resource pattern
     * is stored in the place value 2^({@value GameConstants#PATTERN_SIZE} * a + b).
     * @return the resource pattern for this map
     */
    public int getResourcePattern() {
        return this.patternArray[RESOURCE_INDEX];
    }

    /**
     * Returns the tower pattern corresponding to the map,
     * stored as the bits of an int between 0 and 2^({@value GameConstants#PATTERN_SIZE}^2) - 1.
     * The bit at (a, b) (zero-indexed) in the tower pattern
     * is stored in the place value 2^({@value GameConstants#PATTERN_SIZE} * a + b).
     * @return the tower pattern for this map
     */
    public int getTowerPattern(UnitType towerType) {
        return this.patternArray[towerTypeToPatternIndex(towerType)];
    }

    public boolean isValidPatternCenter(MapLocation loc) {
        return !(loc.x < GameConstants.PATTERN_SIZE / 2
              || loc.y < GameConstants.PATTERN_SIZE / 2
              || loc.x >= gameMap.getWidth() - (GameConstants.PATTERN_SIZE - 1) / 2
              || loc.y >= gameMap.getHeight() - (GameConstants.PATTERN_SIZE - 1) / 2
        );
    }

    public boolean isPassable(MapLocation loc) {
        if (currentRound <= GameConstants.SETUP_ROUNDS){
            return !this.walls[locationToIndex(loc)];
        }
        return !this.walls[locationToIndex(loc)];
    }

    public ArrayList<MapLocation> getRuinArray() {
        return allRuins;
    }

    public boolean hasRuin(MapLocation loc) {
        return allRuinsByLoc[locationToIndex(loc)];
    }

    public Team teamFromPaint(int paint) {
        if (paint == 1 || paint == 2) {
            return Team.A;
        }
        else if (paint == 3 || paint == 4){
            return Team.B;
        }
        else {
            return Team.NEUTRAL;
        }
    }

    public int getPrimaryPaint(Team team) {
        if(team == Team.A) return 1;
        else if(team == Team.B) return 3;
        return 0;
    }

    public int getSecondaryPaint(Team team) {
        if(team == Team.A) return 2;
        else if(team == Team.B) return 4;
        return 0;
    }

    private int towerTypeToPatternIndex(UnitType towerType){
        //TODO: this whole index stuff should be cleaned up but I'm just trying to get to a functional state
        int index = DEFENSE_INDEX;
        if (towerType == UnitType.LEVEL_ONE_MONEY_TOWER) index = MONEY_INDEX;
        if (towerType == UnitType.LEVEL_ONE_PAINT_TOWER) index = PAINT_INDEX;
        return index;
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

    public boolean connectedByPaint(MapLocation loc1, MapLocation loc2) {
        if(getPaint(loc1) == 0 || getPaint(loc2) == 0 || teamFromPaint(getPaint(loc1)) != teamFromPaint(getPaint(loc2))) return false;
        Team t = teamFromPaint(getPaint(loc1));
        Queue<MapLocation> q = new LinkedList<MapLocation>();
        Set<MapLocation> vis = new HashSet<MapLocation>();
        q.add(loc1);
        MapLocation cur;
        int[] dx = {1, 0, -1, 0}, dy = {0, 1, 0, -1};
        while(!q.isEmpty()) {
            cur = q.peek();
            q.remove();
            if(getGameMap().onTheMap(cur) || vis.contains(cur) || teamFromPaint(getPaint(cur)) != t) continue;
            vis.add(cur);
            if(cur == loc2)
                return true;
            for(int i = 0; i < 4; i ++)
                q.add(new MapLocation(cur.x + dx[i], cur.y + dy[i]));
        }
        return false;
    }

    public MapLocation[] getAllRuins() {
        return this.allRuins.toArray(new MapLocation[this.allRuins.size()]);
    }

    public MapLocation[] getAllRuinsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<MapLocation> returnRuins = new ArrayList<MapLocation>();

        for (MapLocation newLocation : getAllLocationsWithinRadiusSquared(center, radiusSquared)) {
            if (hasRuin(newLocation)) {
                returnRuins.add(newLocation);
            }
        }

        return returnRuins.toArray(new MapLocation[returnRuins.size()]);
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

    // *********************************
    // ****** GAMEPLAY *****************
    // *********************************

    public void processBeginningOfRound() {
        currentRound++;

        this.getMatchMaker().startRound(currentRound);
        // Process beginning of each robot's round
        objectInfo.eachRobot((robot) -> {
            robot.processBeginningOfRound();
            return true;
        });
    }

    public void setWinner(Team t, DominationFactor d) {
        gameStats.setWinner(t);
        gameStats.setDominationFactor(d);
    }

    /**
     * @return whether a team painted more of the map than the other team
     */
    public boolean setWinnerIfMoreSquaresPainted(){
        int[] totalSquaresPainted = new int[2];

        // consider team reserves
        totalSquaresPainted[Team.A.ordinal()] += this.teamInfo.getNumberOfPaintedSquares(Team.A);
        totalSquaresPainted[Team.B.ordinal()] += this.teamInfo.getNumberOfPaintedSquares(Team.B);
        
        if (totalSquaresPainted[Team.A.ordinal()] > totalSquaresPainted[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_SQUARES_PAINTED);
            return true;
        } else if (totalSquaresPainted[Team.B.ordinal()] > totalSquaresPainted[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_SQUARES_PAINTED);
            return true;
        }

        return false;
    }

    /**
     * @return whether a team has more money
     */
    public boolean setWinnerIfMoreMoney(){
        int[] totalMoneyValues = new int[2];

        // consider team reserves
        totalMoneyValues[Team.A.ordinal()] += this.teamInfo.getMoney(Team.A);
        totalMoneyValues[Team.B.ordinal()] += this.teamInfo.getMoney(Team.B);
        
        if (totalMoneyValues[Team.A.ordinal()] > totalMoneyValues[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_MONEY);
            return true;
        } else if (totalMoneyValues[Team.B.ordinal()] > totalMoneyValues[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_MONEY);
            return true;
        }
        return false;
    }

    /**
     * @return whether a team has more allied towers alive
     */
    public boolean setWinnerIfMoreTowersAlive(){
        int[] totalTowersAlive = new int[2];

        for (UnitType type: UnitType.values()){
            if (UnitType.isTowerType(type)){
                totalTowersAlive[Team.A.ordinal()] += this.getObjectInfo().getRobotTypeCount(Team.A, type);
                totalTowersAlive[Team.B.ordinal()] += this.getObjectInfo().getRobotTypeCount(Team.B, type);
            }
        }
        
        if (totalTowersAlive[Team.A.ordinal()] > totalTowersAlive[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_TOWERS_ALIVE);
            return true;
        } else if (totalTowersAlive[Team.B.ordinal()] > totalTowersAlive[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_TOWERS_ALIVE);
            return true;
        }
        return false;
    }


    /**
     * @return whether a team has more allied robots alive
     */
    public boolean setWinnerIfMoreRobotsAlive(){
        int[] totalRobotsAlive = new int[2];

        for (UnitType type: UnitType.values()){
            if (UnitType.isRobotType(type)){
                totalRobotsAlive[Team.A.ordinal()] += this.getObjectInfo().getRobotTypeCount(Team.A, type);
                totalRobotsAlive[Team.B.ordinal()] += this.getObjectInfo().getRobotTypeCount(Team.B, type);
            }
        }
        
        if (totalRobotsAlive[Team.A.ordinal()] > totalRobotsAlive[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_ROBOTS_ALIVE);
            return true;
        } else if (totalRobotsAlive[Team.B.ordinal()] > totalRobotsAlive[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_ROBOTS_ALIVE);
            return true;
        }
        return false;
    }

    /**
     * @return whether a team has more paint stored in robots and towers
     */
    public boolean setWinnerIfMorePaintInUnits(){
        int[] paintInUnits = new int[2];

        for (InternalRobot robot : getAllRobots(Team.A)) {
            paintInUnits[Team.A.ordinal()] += robot.getPaint();
        }

        for (InternalRobot robot : getAllRobots(Team.B)) {
            paintInUnits[Team.B.ordinal()] += robot.getPaint();
        }
        
        if (paintInUnits[Team.A.ordinal()] > paintInUnits[Team.B.ordinal()]) {
            setWinner(Team.A, DominationFactor.MORE_PAINT_IN_UNITS);
            return true;
        } else if (paintInUnits[Team.B.ordinal()] > paintInUnits[Team.A.ordinal()]) {
            setWinner(Team.B, DominationFactor.MORE_PAINT_IN_UNITS);
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
            if (setWinnerIfMoreSquaresPainted()) return;
            if (setWinnerIfMoreTowersAlive()) return;
            if (setWinnerIfMoreMoney()) return;
            if (setWinnerIfMorePaintInUnits()) return;
            if (setWinnerIfMoreRobotsAlive()) return;
            setWinnerArbitrary();
        }
    }

    public void processEndOfRound() {
        this.matchMaker.addTeamInfo(Team.A, this.teamInfo.getMoney(Team.A));
        this.matchMaker.addTeamInfo(Team.B, this.teamInfo.getMoney(Team.B));
        this.teamInfo.processEndOfRound();

        this.getMatchMaker().endRound();

        checkEndOfMatch();

        if (gameStats.getWinner() != null)
            running = false;
    }

    private void confirmRuinPlacements(ArrayList<MapLocation> ruins) {
        boolean validPlacements = true;

        for (MapLocation a : ruins) {
            for (MapLocation b : ruins) {
                if (a.distanceSquaredTo(b) < GameConstants.MIN_RUIN_SPACING_SQUARED) {
                    validPlacements = false;
                    break;
                }
            }
        }
    }
    
    // *********************************
    // ****** SPAWNING *****************
    // *********************************

    public int spawnRobot(int ID, UnitType type, MapLocation location, Team team){
        InternalRobot robot = new InternalRobot(this, ID, team, type);
        addRobot(location, robot);
        objectInfo.createRobot(robot);
        controlProvider.robotSpawned(robot);
        this.matchMaker.addSpawnAction(location, team, type);
        return ID;
    }

    public int spawnRobot(UnitType type, MapLocation location, Team team){
        int ID = idGenerator.nextID();
        return spawnRobot(ID, type, location, team);
    }

    // *********************************
    // ****** DESTROYING ***************
    // *********************************

    /**
     * Permanently destroy a robot; left for internal purposes.
     */
    public void destroyRobot(int id) {
        InternalRobot robot = objectInfo.getRobotByID(id);
        MapLocation loc = robot.getLocation();
        
        if (loc != null)
        {
            if (UnitType.isTowerType(robot.getType())) {
                this.towersByLoc[locationToIndex(loc)] = Team.NEUTRAL;
                this.towerLocations.remove(loc);
            }

            removeRobot(loc);
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
