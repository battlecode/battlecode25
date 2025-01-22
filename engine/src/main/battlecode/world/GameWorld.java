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
public class GameWorld {
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
    private int[] markersA;
    private int[] markersB;
    private int[] colorLocations; // No color = 0, Team A color 1 = 1, Team A color 2 = 2, Team B color 1 = 3, Team B color 2 = 4
    private InternalRobot[][] robots;
    private final LiveMap gameMap;
    private final TeamInfo teamInfo;
    private final ObjectInfo objectInfo;

    private final static int RESOURCE_INDEX = 0, DEFENSE_INDEX = 1, MONEY_INDEX = 2, PAINT_INDEX = 3;
     // 0 = resource pattern, 1 = defense tower, 2 = money tower, 3 = paint tower
    private int[] patternArray = {GameConstants.RESOURCE_PATTERN, GameConstants.DEFENSE_TOWER_PATTERN, GameConstants.MONEY_TOWER_PATTERN, GameConstants.PAINT_TOWER_PATTERN};


    private ArrayList<MapLocation> resourcePatternCenters;
    private Team[] resourcePatternCentersByLoc;
    private int[] resourcePatternLifetimes;
    private ArrayList<MapLocation> towerLocations;
    private Team[] towersByLoc; // indexed by location
    private int[] currentDamageIncreases = {0,0};
    private int[] currentNumberUnits = {0,0};

    // List of all ruins, not indexed by location
    private ArrayList<MapLocation> allRuins;
    // Whether there is a ruin on each tile, indexed by location
    private boolean[] allRuinsByLoc;

    private Map<Team, ProfilerCollection> profilerCollections;

    private final RobotControlProvider controlProvider;
    private Random rand;
    private final GameMaker.MatchMaker matchMaker;
    private int areaWithoutWalls;

    @SuppressWarnings("unchecked")
    public GameWorld(LiveMap gm, RobotControlProvider cp, GameMaker.MatchMaker matchMaker) {
        int width = gm.getWidth();
        int height = gm.getHeight();
        int numSquares = width * height;
        int numWalls = 0;
        this.walls = gm.getWallArray();
        this.markersA = new int[numSquares];
        this.markersB = new int[numSquares];
        this.robots = new InternalRobot[width][height]; // if represented in cartesian, should be height-width, but this should allow us to index x-y
        this.currentRound = 0;
        this.idGenerator = new IDGenerator(gm.getSeed());
        this.gameStats = new GameStats();
        this.gameMap = gm;
        this.objectInfo = new ObjectInfo(gm);
        this.colorLocations = new int[numSquares];

        for (boolean wall : walls){
            if (wall) {
                numWalls += 1;
            }
        }
        this.areaWithoutWalls = numSquares - numWalls;

        this.profilerCollections = new HashMap<>();

        this.controlProvider = cp;
        this.rand = new Random(this.gameMap.getSeed());
        this.matchMaker = matchMaker;

        this.controlProvider.matchStarted(this);

        this.teamInfo = new TeamInfo(this);
        this.teamInfo.addMoney(Team.A, GameConstants.INITIAL_TEAM_MONEY);
        this.teamInfo.addMoney(Team.B, GameConstants.INITIAL_TEAM_MONEY);

        // Write match header at beginning of match
        this.matchMaker.makeMatchHeader(this.gameMap);

        this.allRuinsByLoc = gm.getRuinArray();
        this.allRuins = new ArrayList<MapLocation>();
        for (int i = 0; i < numSquares; i++){
            if (this.allRuinsByLoc[i]){
                this.allRuins.add(indexToLocation(i));
            }
        }

        //ignore patterns passed in with map and use hardcoded values
        //this.patternArray = gm.getPatternArray();
        this.resourcePatternCenters = new ArrayList<MapLocation>();
        this.resourcePatternCentersByLoc = new Team[numSquares];
        this.resourcePatternLifetimes = new int[numSquares];
        byte[] initialPaint = gm.getPaintArray();
        for (int i = 0; i < numSquares; i++) {
            this.resourcePatternCentersByLoc[i] = Team.NEUTRAL;
            setPaint(indexToLocation(i), initialPaint[i]);
        }


      
        RobotInfo[] initialBodies = gm.getInitialBodies(); 
        this.towerLocations = new ArrayList<MapLocation>();
        this.towersByLoc = new Team[numSquares]; 
        for (int i = 0; i < numSquares; i++){
            towersByLoc[i] = Team.NEUTRAL;  
        }
        for (int i = 0; i < initialBodies.length; i++) {
            RobotInfo robotInfo = initialBodies[i];
            MapLocation newLocation = robotInfo.location.translate(gm.getOrigin().x, gm.getOrigin().y);
            spawnRobot(robotInfo.ID, robotInfo.type, newLocation, robotInfo.team);
            this.towerLocations.add(newLocation);
            towersByLoc[locationToIndex(newLocation)] = robotInfo.team;
            this.allRuinsByLoc[locationToIndex(newLocation)] = true;
            this.allRuins.add(newLocation);

            // Start initial towers at level 2. Defer upgrade action until the tower's first
            // turn since client only supports actions this way
            InternalRobot robot = getRobot(newLocation);
            UnitType newType = robot.getType().getNextLevel();
            robot.upgradeTower(newType);
            upgradeTower(newType, robot.getTeam());
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
        ArrayList<MapLocation> newResourcePatternCenters = new ArrayList<>();
        for (MapLocation center : resourcePatternCenters) {
            int locIdx = locationToIndex(center);
            Team team = resourcePatternCentersByLoc[locIdx];
            boolean stillActive = checkResourcePattern(team, center);

            if (!stillActive) {
                resourcePatternCentersByLoc[locationToIndex(center)] = Team.NEUTRAL;
                resourcePatternLifetimes[locIdx] = 0;
            }
            else{
                newResourcePatternCenters.add(center);
                resourcePatternLifetimes[locIdx]++;
            }
        }
        this.resourcePatternCenters = newResourcePatternCenters;
    }

    public int getResourcePatternBit(int dx, int dy) {
        return getPatternBit(this.patternArray[RESOURCE_INDEX], dx, dy);
    }

    public int getTowerPatternBit(int dx, int dy, UnitType towerType) {
        return getPatternBit(this.patternArray[towerTypeToPatternIndex(towerType)], dx, dy);
    }

    public int getAreaWithoutWalls() {
        return this.areaWithoutWalls;
    }

    public int getPatternBit(int pattern, int dx, int dy) {
        int bitNum = GameConstants.PATTERN_SIZE * (dx + GameConstants.PATTERN_SIZE / 2)
                        + dy + GameConstants.PATTERN_SIZE / 2;
        int bit = (pattern >> bitNum) & 1;
        return bit;
    }

    public boolean[][] patternToBooleanArray(int pattern){
        boolean[][] boolArray = new boolean[5][5];
        for (int i = 0; i < 5; i++){
            for (int j = 0; j < 5; j++){
                boolArray[i][j] = getPatternBit(pattern, i-2, j-2) == 1;
            }
        }
        return boolArray;
    }

    public boolean checkResourcePattern(Team team, MapLocation center) {
        return checkPattern(this.patternArray[RESOURCE_INDEX], team, center, false);
    }

    public boolean checkTowerPattern(Team team, MapLocation center, UnitType towerType) {
        return checkPattern(this.patternArray[towerTypeToPatternIndex(towerType)], team, center, true);
    }

    public boolean checkPattern(int pattern, Team team, MapLocation center, boolean isTowerPattern) {
        int primary = getPrimaryPaint(team);
        int secondary = getSecondaryPaint(team);
        // boolean[] possibleSymmetries = new boolean[8];
        // for (int i = 0; i < 8; i++) possibleSymmetries[i] = true;
        // int numRemainingSymmetries = 8;
        for (int dx = -GameConstants.PATTERN_SIZE / 2; dx < (GameConstants.PATTERN_SIZE + 1) / 2; dx++) {
            for (int dy = -GameConstants.PATTERN_SIZE / 2; dy < (GameConstants.PATTERN_SIZE + 1) / 2; dy++) {
                // ignore checking paint for center ruin location
                if (dx == 0 && dy == 0 && isTowerPattern)
                    continue;
                int bit = getPatternBit(pattern, dx, dy);
                int paint = getPaint(center.translate(dx, dy));
                if (paint != (bit == 1 ? secondary : primary))
                    return false;
                // Remove symmetry logic as all patterns are symmetric
                // for (int sym = 0; sym < 8; sym++) {
                //     if (possibleSymmetries[sym]) {
                //         int dx2;
                //         int dy2;

                //         switch (sym) {
                //             case 0:
                //                 dx2 = dx;
                //                 dy2 = dy;
                //                 break;
                //             case 1:
                //                 dx2 = -dy;
                //                 dy2 = dx;
                //                 break;
                //             case 2:
                //                 dx2 = -dx;
                //                 dy2 = -dy;
                //                 break;
                //             case 3:
                //                 dx2 = dy;
                //                 dy2 = -dx;
                //                 break;
                //             case 4:
                //                 dx2 = -dx;
                //                 dy2 = dy;
                //                 break;
                //             case 5:
                //                 dx2 = dy;
                //                 dy2 = dx;
                //                 break;
                //             case 6:
                //                 dx2 = dx;
                //                 dy2 = -dy;
                //                 break;
                //             case 7:
                //                 dx2 = -dy;
                //                 dy2 = -dx;
                //                 break;
                //             default:
                //                 dx2 = 0;
                //                 dy2 = 0;
                //                 break;
                //         }

                //         int bit = getPatternBit(pattern, dx, dy);
                //         int paint = getPaint(center.translate(dx2, dy2));

                //         if (paint != (bit == 1 ? secondary : primary)) {
                //             possibleSymmetries[sym] = false;
                //             numRemainingSymmetries -= 1;
                //         }
                //     }
                // }

                // if (numRemainingSymmetries == 0) {
                //     return false;
                // }
            }
        }

        return true;
    }

    public void completeTowerPattern(Team team, UnitType type, MapLocation center) {
        this.towerLocations.add(center);
        this.towersByLoc[locationToIndex(center)] = team;
        spawnRobot(type, center, team);
    }

    public void completeResourcePattern(Team team, MapLocation center) {
        int idx = locationToIndex(center);

        if (this.resourcePatternCentersByLoc[idx] == Team.NEUTRAL) {
            this.resourcePatternCenters.add(center);
        }

        this.resourcePatternCentersByLoc[idx] = team;
        this.resourcePatternLifetimes[idx] = 0;
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

    public PaintType paintTypeFromInt(Team team, int paint) {
        Team paintTeam = teamFromPaint(paint);

        if (paintTeam == Team.NEUTRAL) {
            return PaintType.EMPTY;
        } else if (paintTeam == team) {
            return isPrimaryPaint(paint) ? PaintType.ALLY_PRIMARY : PaintType.ALLY_SECONDARY;
        } else {
            return isPrimaryPaint(paint) ? PaintType.ENEMY_PRIMARY : PaintType.ENEMY_SECONDARY;
        }
    }

    public PaintType getPaintType(Team team, MapLocation loc) {
        return paintTypeFromInt(team, getPaint(loc));
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
        if (!isPaintable(loc)) return;
        if (teamFromPaint(this.colorLocations[locationToIndex(loc)]) != Team.NEUTRAL){
        this.getTeamInfo().addPaintedSquares(-1, teamFromPaint(this.colorLocations[locationToIndex(loc)]));
        }
        if (teamFromPaint(paint) != Team.NEUTRAL){
        this.getTeamInfo().addPaintedSquares(1, teamFromPaint(paint));
        }
        this.colorLocations[locationToIndex(loc)] = paint;
    }

    public int[] getmarkersArray(Team team) {
        switch (team) {
            case A:
                return markersA;
            case B:
                return markersB;
            default:
                return null;
        }
    }

    public int getMarker(Team team, MapLocation loc) {
        return this.getmarkersArray(team)[locationToIndex(loc)];
    }

    public void setMarker(Team team, MapLocation loc, int marker) {
        if (!isPaintable(loc)) return;
        if (marker == 0){
            this.matchMaker.addUnmarkAction(loc);
        }
        else {
            this.matchMaker.addMarkAction(loc, !isPrimaryPaint(marker));
        }
        this.getmarkersArray(team)[locationToIndex(loc)] = marker;
    }

    public void markPattern(int pattern, Team team, MapLocation center, int rotationAngle, boolean reflect, boolean isTowerPattern) {
        for (int dx = -GameConstants.PATTERN_SIZE / 2; dx < (GameConstants.PATTERN_SIZE + 1) / 2; dx++) {
            for (int dy = -GameConstants.PATTERN_SIZE / 2; dy < (GameConstants.PATTERN_SIZE + 1) / 2; dy++) {
                // int symmetry = 4 * (reflect ? 1 : 0) + rotationAngle;
                int dx2 = dx;
                int dy2 = dy;
                // Remove symmetry logic as all patterns are symmetric
                // switch (symmetry) {
                //     case 0:
                //         dx2 = dx;
                //         dy2 = dy;
                //         break;
                //     case 1:
                //         dx2 = -dy;
                //         dy2 = dx;
                //         break;
                //     case 2:
                //         dx2 = -dx;
                //         dy2 = -dy;
                //         break;
                //     case 3:
                //         dx2 = dy;
                //         dy2 = -dx;
                //         break;
                //     case 4:
                //         dx2 = -dx;
                //         dy2 = dy;
                //         break;
                //     case 5:
                //         dx2 = dy;
                //         dy2 = dx;
                //         break;
                //     case 6:
                //         dx2 = dx;
                //         dy2 = -dy;
                //         break;
                //     case 7:
                //         dx2 = -dy;
                //         dy2 = -dx;
                //         break;
                //     default:
                //         throw new RuntimeException("THIS ERROR SHOULD NEVER HAPPEN! checkPattern is broken");
                // }

                int bit = getPatternBit(pattern, dx, dy);
                MapLocation loc = center.translate(dx2, dy2);
                setMarker(team, loc, bit + 1);
            }
        }
    }

    public void markTowerPattern(UnitType type, Team team, MapLocation loc, int rotationAngle, boolean reflect) {
        markPattern(this.getTowerPattern(type), team, loc, rotationAngle, reflect, true);
    }

    public void markResourcePattern(Team team, MapLocation loc, int rotationAngle, boolean reflect) {
        markPattern(this.getResourcePattern(), team, loc, rotationAngle, reflect, false);
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

    public int getNumResourcePatterns(Team team){
        int numPatterns = 0;
        for (MapLocation loc : this.resourcePatternCenters) {
            int locIdx = locationToIndex(loc);
            if (this.resourcePatternCentersByLoc[locIdx] == team && this.resourcePatternLifetimes[locIdx] >= GameConstants.RESOURCE_PATTERN_ACTIVE_DELAY)
                numPatterns++;
        }
        return numPatterns;
    }

    public int extraResourcesFromPatterns(Team team){
        return getNumResourcePatterns(team) * GameConstants.EXTRA_RESOURCES_FROM_PATTERN;
    }

    public int getDefenseTowerDamageIncrease(Team team){
        return this.currentDamageIncreases[team.ordinal()];
    }

    public void upgradeTower(UnitType newType, Team team){
        if (newType == UnitType.LEVEL_TWO_DEFENSE_TOWER || newType == UnitType.LEVEL_THREE_DEFENSE_TOWER)
            this.currentDamageIncreases[team.ordinal()] += GameConstants.EXTRA_TOWER_DAMAGE_LEVEL_INCREASE;
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

    public boolean isValidPatternCenter(MapLocation loc, boolean isTower) {
        return (!(loc.x < GameConstants.PATTERN_SIZE / 2
              || loc.y < GameConstants.PATTERN_SIZE / 2
              || loc.x >= gameMap.getWidth() - (GameConstants.PATTERN_SIZE - 1) / 2
              || loc.y >= gameMap.getHeight() - (GameConstants.PATTERN_SIZE - 1) / 2
        )) && (isTower || areaIsPaintable(loc)) ;
    }

    // checks that location has no walls/ruins in the surrounding 5x5 area
    public boolean areaIsPaintable(MapLocation loc){
        for (int dx = -GameConstants.PATTERN_SIZE / 2; dx < (GameConstants.PATTERN_SIZE + 1) / 2; dx++) {
            for (int dy = -GameConstants.PATTERN_SIZE / 2; dy < (GameConstants.PATTERN_SIZE + 1) / 2; dy++) {
                MapLocation newLoc = loc.translate(dx, dy);
                if (!isPaintable(newLoc))
                    return false;
            }
        }
        return true;
    }

    public boolean isPassable(MapLocation loc) {
        return !(this.walls[locationToIndex(loc)] || this.hasRuin(loc));
    }

    public boolean isPaintable(MapLocation loc){
        return isPassable(loc);
    }

    public ArrayList<MapLocation> getRuinArray() {
        return allRuins;
    }

    public boolean hasRuin(MapLocation loc) {
        return allRuinsByLoc[locationToIndex(loc)];
    }

    public boolean hasResourcePatternCenter(MapLocation loc, Team team) {
        return resourcePatternCentersByLoc[locationToIndex(loc)] == team;
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

    public boolean isPrimaryPaint(int paint) {
        return paint == 1 || paint == 3;
    }

    public int getPrimaryPaint(Team team) {
        if (team == Team.A)
            return 1;
        else if (team == Team.B)
            return 3;
        return 0;
    }

    public int getSecondaryPaint(Team team) {
        if (team == Team.A)
            return 2;
        else if(team == Team.B)
            return 4;
        return 0;
    }

    private int towerTypeToPatternIndex(UnitType towerType){
        switch (towerType){
            case LEVEL_ONE_DEFENSE_TOWER: return DEFENSE_INDEX;
            case LEVEL_TWO_DEFENSE_TOWER: return DEFENSE_INDEX;
            case LEVEL_THREE_DEFENSE_TOWER: return DEFENSE_INDEX;
            case LEVEL_ONE_MONEY_TOWER: return MONEY_INDEX;
            case LEVEL_TWO_MONEY_TOWER: return MONEY_INDEX;
            case LEVEL_THREE_MONEY_TOWER: return MONEY_INDEX;
            case LEVEL_ONE_PAINT_TOWER: return PAINT_INDEX;
            case LEVEL_TWO_PAINT_TOWER: return PAINT_INDEX;
            case LEVEL_THREE_PAINT_TOWER: return PAINT_INDEX;
            default: return -1;
        }
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

    public boolean connectedByPaint(Team t, MapLocation robotLoc, MapLocation towerLoc) {
        if (teamFromPaint(getPaint(robotLoc)) != t)
            return false;
        Queue<MapLocation> q = new LinkedList<MapLocation>();
        Set<MapLocation> vis = new HashSet<MapLocation>();
        q.add(robotLoc);
        MapLocation cur;
        int[] dx = {1, 0, -1, 0}, dy = {0, 1, 0, -1};
        while(!q.isEmpty()) {
            cur = q.peek();
            q.remove();
            if(cur.equals(towerLoc))
                return true;
            if(!getGameMap().onTheMap(cur) || vis.contains(cur) || teamFromPaint(getPaint(cur)) != t) continue;
            vis.add(cur);
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
        updateResourcePatterns();

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
            if (type.isTowerType()){
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
            if (type.isRobotType()){
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
        int teamACoverage = (int) Math.round(this.teamInfo.getNumberOfPaintedSquares(Team.A) * 1000.0 / this.areaWithoutWalls);
        this.matchMaker.addTeamInfo(Team.A, this.teamInfo.getMoney(Team.A), teamACoverage, getNumResourcePatterns(Team.A));
        int teamBCoverage = (int) Math.round(this.teamInfo.getNumberOfPaintedSquares(Team.B) * 1000.0 / this.areaWithoutWalls);
        this.matchMaker.addTeamInfo(Team.B, this.teamInfo.getMoney(Team.B), teamBCoverage, getNumResourcePatterns(Team.B));
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
        InternalRobot robot = new InternalRobot(this, ID, team, type, location);
        addRobot(location, robot);
        objectInfo.createRobot(robot);
        controlProvider.robotSpawned(robot);
        if (type.isTowerType()){
            this.teamInfo.addTowers(1, team);
            robot.addPaint(GameConstants.INITIAL_TOWER_PAINT_AMOUNT);
        }
        else
            robot.addPaint((int) Math.round(type.paintCapacity * GameConstants.INITIAL_ROBOT_PAINT_PERCENTAGE / 100.0)); 
        if (type == UnitType.LEVEL_ONE_DEFENSE_TOWER)
            this.currentDamageIncreases[team.ordinal()] += GameConstants.EXTRA_DAMAGE_FROM_DEFENSE_TOWER;
        this.currentNumberUnits[team.ordinal()] += 1;
        return ID;
    }

    public int spawnRobot(UnitType type, MapLocation location, Team team) {
        int ID = idGenerator.nextID();
        return spawnRobot(ID, type, location, team);
    }

    // *********************************
    // ****** DESTROYING ***************
    // *********************************

    /**
     * Permanently destroy a robot
     */
    public void destroyRobot(int id) {
        destroyRobot(id, false, false);
    }

    public void destroyRobot(int id, boolean fromException, boolean fromDamage){
        InternalRobot robot = objectInfo.getRobotByID(id);
        MapLocation loc = robot.getLocation();
        
        if (loc != null)
        {
            if (robot.getType().isTowerType()) {
                this.towersByLoc[locationToIndex(loc)] = Team.NEUTRAL;
                this.towerLocations.remove(loc);
                this.teamInfo.addTowers(-1, robot.getTeam());
            }
            switch (robot.getType()){
                case LEVEL_ONE_DEFENSE_TOWER: this.currentDamageIncreases[robot.getTeam().ordinal()] -= GameConstants.EXTRA_DAMAGE_FROM_DEFENSE_TOWER; break;
                case LEVEL_TWO_DEFENSE_TOWER: this.currentDamageIncreases[robot.getTeam().ordinal()] -= GameConstants.EXTRA_DAMAGE_FROM_DEFENSE_TOWER + GameConstants.EXTRA_TOWER_DAMAGE_LEVEL_INCREASE; break;
                case LEVEL_THREE_DEFENSE_TOWER: this.currentDamageIncreases[robot.getTeam().ordinal()] -= GameConstants.EXTRA_DAMAGE_FROM_DEFENSE_TOWER + 2 * GameConstants.EXTRA_TOWER_DAMAGE_LEVEL_INCREASE; break;
                default: break;
            }

            removeRobot(loc);
        }

        controlProvider.robotKilled(robot);
        objectInfo.destroyRobot(id);
        if (fromDamage || fromException)
            matchMaker.addDieAction(id, fromException);
        else
            matchMaker.addDied(id);
        this.currentNumberUnits[robot.getTeam().ordinal()] -= 1;
        if (this.currentNumberUnits[robot.getTeam().ordinal()] == 0){
            setWinner(robot.getTeam().opponent(), DominationFactor.DESTROY_ALL_UNITS);
        }
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
    
}
