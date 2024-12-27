package battlecode.common;

import java.util.Map;

/**
 * A RobotController allows contestants to make their robot sense and interact
 * with the game world. When a contestant's <code>RobotPlayer</code> is
 * constructed, it is passed an instance of <code>RobotController</code> that
 * controls the newly created robot.
 */
@SuppressWarnings("unused")
public strictfp interface RobotController {

    // *********************************
    // ****** GLOBAL QUERY METHODS *****
    // *********************************

    /**
     * Returns the current round number, where round 1 is the first round of the
     * match.
     *
     * @return the current round number, where round 1 is the first round of the
     *         match
     *
     * @battlecode.doc.costlymethod
     */
    int getRoundNum();

    /**
     * Returns the width of the game map. Valid x coordinates range from
     * 0 (inclusive) to the width (exclusive).
     *
     * @return the map width
     *
     * @battlecode.doc.costlymethod
     */
    int getMapWidth();

    /**
     * Returns the height of the game map. Valid y coordinates range from
     * 0 (inclusive) to the height (exclusive).
     *
     * @return the map height
     *
     * @battlecode.doc.costlymethod
     */
    int getMapHeight();

    // *********************************
    // ****** UNIT QUERY METHODS *******
    // *********************************

    /**
     * Returns the ID of this robot.
     *
     * @return the ID of this robot
     *
     * @battlecode.doc.costlymethod
     */
    int getID();

    /**
     * Returns this robot's Team.
     *
     * @return this robot's Team
     *
     * @battlecode.doc.costlymethod
     */
    Team getTeam();

    /**
     * Returns this robot's current location.
     *
     * @return this robot's current location
     *
     * @battlecode.doc.costlymethod
     */
    MapLocation getLocation();

    /**
     * Returns this robot's current health.
     *
     * @return this robot's current health
     *
     * @battlecode.doc.costlymethod
     */
    int getHealth();

    /**
     * Returns this robot's current paint amount.
     *
     * @return this robot's current paint amount
     *
     * @battlecode.doc.costlymethod
     */
    int getPaint();

    /**
     * Returns the amount of money that this robot's team has.
     *
     * @return the amount of money this robot's team has
     *
     * @battlecode.doc.costlymethod
     */
    int getMoney();

    // ***********************************
    // ****** GENERAL VISION METHODS *****
    // ***********************************

    /**
     * Checks whether a MapLocation is on the map.
     *
     * @param loc the location to check
     * @return true if the location is on the map; false otherwise
     *
     * @battlecode.doc.costlymethod
     */
    boolean onTheMap(MapLocation loc);

    /**
     * Checks whether the given location is within the robot's vision range, and if
     * it is on the map.
     *
     * @param loc the location to check
     * @return true if the given location is within the robot's vision range and is
     *         on the map; false otherwise
     *
     * @battlecode.doc.costlymethod
     */
    boolean canSenseLocation(MapLocation loc);

    /**
     * Checks whether a robot is at a given location. Assumes the location is valid.
     *
     * @param loc the location to check
     * @return true if a robot is at the location
     * @throws GameActionException if the location is not within vision range or on
     *                             the map
     *
     * @battlecode.doc.costlymethod
     */
    boolean isLocationOccupied(MapLocation loc) throws GameActionException;

    /**
     * Checks whether a robot is at a given location. Assume the location is valid.
     *
     * @param loc the location to check
     * @return true if a robot is at the location, false if there is no robot or the
     *         location can not be sensed
     *
     * @battlecode.doc.costlymethod
     */
    boolean canSenseRobotAtLocation(MapLocation loc);

    /**
     * Senses the robot at the given location, or null if there is no robot
     * there.
     *
     * @param loc the location to check
     * @return the robot at the given location
     * @throws GameActionException if the location is not within vision range
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo senseRobotAtLocation(MapLocation loc) throws GameActionException;

    /**
     * Tests whether the given robot exists and if it is within this robot's
     * vision range.
     *
     * @param id the ID of the robot to query
     * @return true if the given robot is within this robot's vision range and
     *         exists;
     *         false otherwise
     *
     * @battlecode.doc.costlymethod
     */
    boolean canSenseRobot(int id);

    /**
     * Senses information about a particular robot given its ID.
     *
     * @param id the ID of the robot to query
     * @return a RobotInfo object for the sensed robot
     * @throws GameActionException if the robot cannot be sensed (for example,
     *                             if it doesn't exist or is out of vision range)
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo senseRobot(int id) throws GameActionException;

    /**
     * Returns all robots within vision radius. The objects are returned in no
     * particular order.
     *
     * @return array of RobotInfo objects, which contain information about all
     *         the robots you saw
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo[] senseNearbyRobots();

    /**
     * Returns all robots that can be sensed within a certain distance of this
     * robot. The objects are returned in no particular order.
     *
     * @param radiusSquared return robots this distance away from the center of
     *                      this robot; if -1 is passed, all robots within vision
     *                      radius are returned;
     *                      if radiusSquared is larger than the robot's vision
     *                      radius, the vision
     *                      radius is used
     * @return array of RobotInfo objects of all the robots you saw
     * @throws GameActionException if the radius is negative (and not -1)
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo[] senseNearbyRobots(int radiusSquared) throws GameActionException;

    /**
     * Returns all robots of a given team that can be sensed within a certain
     * distance of this robot. The objects are returned in no particular order.
     *
     * @param radiusSquared return robots this distance away from the center of
     *                      this robot; if -1 is passed, all robots within vision
     *                      radius are returned;
     *                      if radiusSquared is larger than the robot's vision
     *                      radius, the vision
     *                      radius is used
     * @param team          filter game objects by the given team; if null is
     *                      passed,
     *                      robots from any team are returned
     * @return array of RobotInfo objects of all the robots you saw
     * @throws GameActionException if the radius is negative (and not -1)
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo[] senseNearbyRobots(int radiusSquared, Team team) throws GameActionException;

    /**
     * Returns all robots of a given team that can be sensed within a certain
     * radius of a specified location. The objects are returned in no particular
     * order.
     *
     * @param center        center of the given search radius
     * @param radiusSquared return robots this distance away from the center of
     *                      this robot; if -1 is passed, all robots within vision
     *                      radius are returned;
     *                      if radiusSquared is larger than the robot's vision
     *                      radius, the vision
     *                      radius is used
     * @param team          filter game objects by the given team; if null is
     *                      passed,
     *                      objects from all teams are returned
     * @return array of RobotInfo objects of the robots you saw
     * @throws GameActionException if the radius is negative (and not -1) or the
     *                             center given is null
     *
     * @battlecode.doc.costlymethod
     */
    RobotInfo[] senseNearbyRobots(MapLocation center, int radiusSquared, Team team) throws GameActionException;

    /**
     * Given a senseable location, returns whether that location is passable (a wall).
     * 
     * @param loc the given location
     * @return whether that location is passable
     * @throws GameActionException if the robot cannot sense the given location
     *
     * @battlecode.doc.costlymethod
     */
    boolean sensePassability(MapLocation loc) throws GameActionException;

    /**
     * Senses the map info at a location. MapInfo includes walls, paint, marks,
     * and ruins
     *
     * @param loc to sense map at
     * @return MapInfo describing map at location
     * @throws GameActionException if location can not be sensed
     *
     * @battlecode.doc.costlymethod
     */
    MapInfo senseMapInfo(MapLocation loc) throws GameActionException;

    /**
     * Return map info for all senseable locations.
     * MapInfo includes walls, paint, marks, and ruins.
     *
     * @return MapInfo about all locations within vision radius
     *
     * @battlecode.doc.costlymethod
     */
    MapInfo[] senseNearbyMapInfos();

    /**
     * Return map info for all senseable locations within a radius squared.
     * If radiusSquared is larger than the robot's vision radius, uses the robot's
     * vision radius instead. If -1 is passed, all locations within vision radius
     * are returned.
     * MapInfo includes walls, paint, marks, and ruins.
     *
     * @param radiusSquared the squared radius of all locations to be returned
     * @return MapInfo about all locations within vision radius
     * @throws GameActionException if the radius is negative (and not -1)
     *
     * @battlecode.doc.costlymethod
     */
    MapInfo[] senseNearbyMapInfos(int radiusSquared) throws GameActionException;

    /**
     * Return map info for all senseable locations within vision radius of a center
     * location.
     * MapInfo includes walls, paint, marks, and ruins
     *
     * @param center the center of the search area
     * @return MapInfo about all locations within vision radius
     * @throws GameActionException if center is null
     *
     * @battlecode.doc.costlymethod
     */
    MapInfo[] senseNearbyMapInfos(MapLocation center) throws GameActionException;

    /**
     * Return map info for all senseable locations within a radius squared of a
     * center location.
     * If radiusSquared is larger than the robot's vision radius, uses the robot's
     * vision radius instead. If -1 is passed, all locations within vision radius
     * are returned.
     * MapInfo includes walls, paint, marks, and ruins
     *
     * @param center        the center of the search area
     * @param radiusSquared the squared radius of all locations to be returned
     * @return MapInfo about all locations within vision radius
     * @throws GameActionException if the radius is negative (and not -1)
     *
     * @battlecode.doc.costlymethod
     */
    MapInfo[] senseNearbyMapInfos(MapLocation center, int radiusSquared) throws GameActionException;

    /**
     * Returns the location of all nearby ruins that are visible to the robot.
     * If radiusSquared is greater than the robot's vision radius, uses the robot's
     * vision radius instead.
     * 
     * @param radiusSquared squared radius of all locations to be returned, -1 for
     *                      max radius
     * @return all locations containing ruins
     * @throws GameActionException if a radius less than -1 is provided
     * 
     * @battlecode.doc.costlymethod
     **/
    MapLocation[] senseNearbyRuins(int radiusSquared) throws GameActionException;

    /**
     * Returns the location adjacent to current location in the given direction.
     *
     * @param dir the given direction
     * @return the location adjacent to current location in the given direction
     *
     * @battlecode.doc.costlymethod
     */
    MapLocation adjacentLocation(Direction dir);

    /**
     * Returns a list of all locations within the given radiusSquared of a location.
     * If radiusSquared is larger than the robot's vision radius, uses the robot's
     * vision radius instead.
     *
     * Checks that radiusSquared is non-negative.
     *
     * @param center        the given location
     * @param radiusSquared return locations within this distance away from center
     * @return list of locations on the map and within radiusSquared of center
     * @throws GameActionException if the radius is negative (and not -1)
     *
     * @battlecode.doc.costlymethod
     */
    MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared) throws GameActionException;

    // ***********************************
    // ****** READINESS METHODS **********
    // ***********************************

    /**
     * Tests whether the robot can act.
     * 
     * @return true if the robot can act
     *
     * @battlecode.doc.costlymethod
     */
    boolean isActionReady();

    /**
     * Returns the number of action cooldown turns remaining before this unit can
     * act again.
     * When this number is strictly less than {@link GameConstants#COOLDOWN_LIMIT},
     * isActionReady()
     * is true and the robot can act again. This number decreases by
     * {@link GameConstants#COOLDOWNS_PER_TURN} every turn.
     *
     * @return the number of action turns remaining before this unit can act again
     *
     * @battlecode.doc.costlymethod
     */
    int getActionCooldownTurns();

    /**
     * Tests whether the robot can move.
     * 
     * @return true if the robot can move
     *
     * @battlecode.doc.costlymethod
     */
    boolean isMovementReady();

    /**
     * Returns the number of movement cooldown turns remaining before this unit can
     * move again.
     * When this number is strictly less than {@link GameConstants#COOLDOWN_LIMIT},
     * isMovementReady()
     * is true and the robot can move again. This number decreases by
     * {@link GameConstants#COOLDOWNS_PER_TURN} every turn.
     *
     * @return the number of cooldown turns remaining before this unit can move
     *         again
     *
     * @battlecode.doc.costlymethod
     */
    int getMovementCooldownTurns();

    // ***********************************
    // ****** MOVEMENT METHODS ***********
    // ***********************************

    /**
     * Checks whether this robot can move one step in the given direction.
     * Returns false if the robot is not in a mode that can move, if the target
     * location is not on the map, if the target location is occupied, if the target
     * location is impassible, or if there are cooldown turns remaining.
     *
     * @param dir the direction to move in
     * @return true if it is possible to call <code>move</code> without an exception
     *
     * @battlecode.doc.costlymethod
     */
    boolean canMove(Direction dir);

    /**
     * Moves one step in the given direction.
     *
     * @param dir the direction to move in
     * @throws GameActionException if the robot cannot move one step in this
     *                             direction, such as cooldown being too high, the
     *                             target location being
     *                             off the map, or the target destination being
     *                             occupied by another robot,
     *                             or the target destination being impassible.
     *
     * @battlecode.doc.costlymethod
     */
    void move(Direction dir) throws GameActionException;

    // ***********************************
    // *********** BUILDING **************
    // ***********************************

    /**
     * Checks if a tower can spawn a robot at the given location.
     * Robots can spawn within a circle of radius of sqrt(4) of the tower.
     * 
     * @param type the type of robot to spawn
     * @param loc  the location to spawn the robot at
     * @return true if robot can be built at loc
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canBuildRobot(UnitType type, MapLocation loc);

    /**
     * Spawns a robot at the given location.
     * Robots can spawn within a circle of radius of sqrt(4) of the tower.
     * 
     * @param type the type of robot to spawn
     * @param loc  the location to spawn the robot at
     * 
     * @battlecode.doc.costlymethod
     */
    void buildRobot(UnitType type, MapLocation loc) throws GameActionException;

    /**
     * Checks if the location can be marked.
     * 
     * @param loc the location to mark
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canMark(MapLocation loc);

    /**
     * Checks if the location can be marked.
     * 
     * @param loc the location to mark
     * @param secondary whether the secondary color should be used
     * 
     * @battlecode.doc.costlymethod
     */
    void mark(MapLocation loc, boolean secondary) throws GameActionException;

    /**
     * Checks if a mark at the location can be removed.
     * 
     * @param loc the location that has the mark
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canRemoveMark(MapLocation loc);

    /**
     * Removes the mark at the given location.
     * 
     * @param loc the location that has the mark
     * 
     * @battlecode.doc.costlymethod
     */
    void removeMark(MapLocation loc) throws GameActionException;

    /**
     * Checks if the robot can build a tower by marking a 5x5 pattern centered at
     * the given location.
     * This requires there to be a ruin at the location.
     * 
     * @param loc  the center of the 5x5 pattern
     * @return true if a tower pattern can be marked at loc
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canMarkTowerPattern(MapLocation loc);

    /**
     * Builds a tower by marking a 5x5 pattern centered at the given location.
     * This requires there to be a ruin at the location.
     * 
     * @param type the type of tower to mark the pattern for
     * @param loc  the center of the 5x5 pattern
     * 
     * @battlecode.doc.costlymethod
     */
    void markTowerPattern(UnitType type, MapLocation loc) throws GameActionException;

    /**
     * Builds a tower by marking a 5x5 pattern centered at the given location.
     * This requires there to be a ruin at the location.
     * 
     * @param type          the type of tower to mark the pattern for
     * @param loc           the center of the 5x5 pattern
     * @param rotationAngle the angle to rotate (in units of 90 degrees clockwise)
     * @param reflect       whether to reflect the pattern
     * 
     * @battlecode.doc.costlymethod
     */
    void markTowerPattern(UnitType type, MapLocation loc, int rotationAngle, boolean reflect) throws GameActionException;

    /**
     * Checks if a tower can be upgraded by verifying conditions on the location, team, 
     * tower level, and cost.
     * 
     * @param loc the location to upgrade the tower at
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canUpgradeTower(MapLocation loc);

    /**
     * Upgrades a tower if possible; subtracts the corresponding amount of money from the team.
     * 
     * @param loc the location to upgrade the tower at
     * 
     * @battlecode.doc.costlymethod
     */
    void upgradeTower(MapLocation loc) throws GameActionException;

    /**
     * Checks if the robot can mark a 5x5 special resource pattern centered at the
     * given location.
     * 
     * @param loc the center of the resource pattern
     * @return true if an SRP can be marked at loc
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canMarkResourcePattern(MapLocation loc);

    /**
     * Marks a 5x5 special resource pattern centered at the given location.
     * 
     * @param loc the center of the resource pattern
     * 
     * @battlecode.doc.costlymethod
     */
    void markResourcePattern(MapLocation loc) throws GameActionException;

    /**
     * Marks a 5x5 special resource pattern centered at the given location.
     * 
     * @param loc           the center of the resource pattern
     * @param rotationAngle the angle to rotate (in units of 90 degrees clockwise)
     * @param reflect       whether to reflect the pattern
     * 
     * @battlecode.doc.costlymethod
     */
    void markResourcePattern(MapLocation loc, int rotationAngle, boolean reflect) throws GameActionException;

    /**
     * Checks if the robot can build a tower at the given location.
     * This requires there to be a ruin at the location.
     * This also requires the 5x5 region to be painted correctly.
     * 
     * @param type the type of tower to build
     * @param loc  the location to build at
     * @return true if tower can be built at loc
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canCompleteTowerPattern(UnitType type, MapLocation loc);

    /**
     * Builds a tower at the given location.
     * This requires there to be a ruin at the location.
     * This also requires the 5x5 region to be painted correctly.
     * 
     * @param type the type of tower to build
     * @param loc  the location to build at
     * 
     * @battlecode.doc.costlymethod
     */
    void completeTowerPattern(UnitType type, MapLocation loc) throws GameActionException;

    /**
     * Checks if the robot can complete a 5x5 special resource pattern centered at the
     * given location. This requires the 5x5 region to be painted correctly.
     * 
     * @param loc the center of the resource pattern
     * @return true if the SRP can be completed at loc
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canCompleteResourcePattern(MapLocation loc);

    /**
     * Completes a 5x5 special resource pattern centered at the given location.
     * This requires the 5x5 region to be painted correctly.
     * 
     * @param loc the center of the resource pattern
     * 
     * @battlecode.doc.costlymethod
     */
    void completeResourcePattern(MapLocation loc) throws GameActionException;

    // ****************************
    // ***** ATTACK / HEAL ********
    // ****************************

    /**
     * Tests whether this robot can attack the given location. Types of
     * attacks for specific units determine whether or not towers, other
     * robots, or empty tiles can be attacked. 
     *
     * @param loc target location to attack
     * @return whether it is possible to attack the given location
     *
     * @battlecode.doc.costlymethod
     */
    boolean canAttack(MapLocation loc);

    /** 
     * Performs the specific attack for this robot type.
     *
     * @param loc the target location to attack (for splashers, the center location)
     *      Note: for a tower, leaving loc null represents an area attack
     * @param useSecondaryColor whether or not the attack should use a secondary color
     * @throws GameActionException if conditions for attacking are not satisfied
     *
     * @battlecode.doc.costlymethod
     */
    void attack(MapLocation loc, boolean useSecondaryColor) throws GameActionException;
    
    /** 
     * Performs the specific attack for this robot type, defaulting to the
     * primary color
     *
     * @param loc the target location to attack (for splashers, the center location)
     *      Note: for a tower, leaving loc null represents an area attack
     * @throws GameActionException if conditions for attacking are not satisfied
     *
     * @battlecode.doc.costlymethod
     */
    void attack(MapLocation loc) throws GameActionException;

    /**
     * Tests whether this robot (which must be a mopper) can perform
     * a mop swing in a specific direction
     *
     * @param dir the direction in which to mop swing
     * @return whether it is possible to mop swing in the given direction
     *
     * @battlecode.doc.costlymethod
     */
    boolean canMopSwing(Direction dir);

    /**
     * Performs a mop swing in the given direction (only for moppers!)
     *
     * @param dir the direction in which to mop swing
     * @throws GameActionException if conditions for attacking are not satisfied
     * 
     * @battlecode.doc.costlymethod
     */
    void mopSwing(Direction dir) throws GameActionException;

    // ***********************************
    // ****** COMMUNICATION METHODS ******
    // ***********************************

    /**
     * Returns true if the unit can send a message to a specific
     * location, false otherwise. We can send a message to a location
     * if it is within a specific distance and connected by paint,
     * and only if one unit is a robot and the other is a tower.
     * 
     * @param loc the location to send the message to
     * @param messageContent an int representing the content of the
     * message (up to 4 bytes)
     * 
     * @battlecode.doc.costlymethod
     */
    boolean canSendMessage(MapLocation loc, int messageContent);

    /**
     * Sends a message (contained in an int, so 4 bytes) to a specific
     * unit at a location on the map, if it is possible
     * 
     * @param loc the location to send the message to
     * @param messageContent an int representing the content of the
     * message (up to 4 bytes)
     * @throws GameActionException if conditions for messaging are not 
     * satisfied
     * 
     * @battlecode.doc.costlymethod
     */
    void sendMessage(MapLocation loc, int messageContent) throws GameActionException;

    // ***********************************
    // ****** OTHER ACTION METHODS *******
    // ***********************************

    /**
     * Tests whether you can transfer paint to a given robot/tower.
     * 
     * You can give paint to an allied robot if you are a mopper and can act at the
     * given location.
     * You can give/take paint from allied towers regardless of type, if you can act
     * at the location.
     * 
     * @param loc    the location of the robot/tower to transfer paint to
     * @param amount the amount of paint to transfer. Positive to give paint,
     *               negative to take paint.
     * @return true if the robot can transfer paint to a robot/tower at the given
     *         location
     */
    boolean canTransferPaint(MapLocation loc, int amount);

    /**
     * Transfers paint from the robot's stash to the stash of the allied
     * robot or tower at loc.
     * 
     * @param loc    the location of the robot/tower to transfer paint to
     * @param amount the amount of paint to transfer. Positive to give paint,
     *               negative to take paint.
     * @throws GameActionException if the robot is not able to transfer paint to the
     *                             location
     */
    void transferPaint(MapLocation loc, int amount) throws GameActionException;

    /**
     * Causes your team to lose the game. It's like typing "gg."
     *
     * @battlecode.doc.costlymethod
     */
    void resign();

    // ***********************************
    // ******** DEBUG METHODS ************
    // ***********************************

    /**
     * Sets the indicator string for this robot for debugging purposes. Only the
     * first
     * {@link GameConstants#INDICATOR_STRING_MAX_LENGTH} characters are used.
     *
     * @param string the indicator string this round
     *
     * @battlecode.doc.costlymethod
     */
    void setIndicatorString(String string);

    /**
     * Draw a dot on the game map for debugging purposes.
     *
     * @param loc   the location to draw the dot
     * @param red   the red component of the dot's color
     * @param green the green component of the dot's color
     * @param blue  the blue component of the dot's color
     *
     * @battlecode.doc.costlymethod
     */
    void setIndicatorDot(MapLocation loc, int red, int green, int blue);

    /**
     * Draw a line on the game map for debugging purposes.
     *
     * @param startLoc the location to draw the line from
     * @param endLoc   the location to draw the line to
     * @param red      the red component of the line's color
     * @param green    the green component of the line's color
     * @param blue     the blue component of the line's color
     *
     * @battlecode.doc.costlymethod
     */
    void setIndicatorLine(MapLocation startLoc, MapLocation endLoc, int red, int green, int blue);

    /**
     * Adds a marker to the timeline at the current 
     * round for debugging purposes.
     * Only the first
     * {@link GameConstants#TIMELINE_LABEL_MAX_LENGTH} characters are used.
     * 
     * @param label the label for the timeline marker
     * @param red the red component of the marker's color
     * @param green the green component of the marker's color
     * @param blue the blue component of the marker's color
     * 
     * @battlecode.doc.costlymethod
     */
    void setTimelineMarker(String label, int red, int green, int blue);
}
