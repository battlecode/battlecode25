package battlecode.common;

/**
 * RobotInfo stores basic information that was 'sensed' of another Robot. This
 * info is ephemeral and there is no guarantee any of it will remain the same
 * between rounds.
 */
public class RobotInfo {

    /**
     * The unique ID of the robot.
     */
    public final int ID;

    /**
     * The Team that the robot is on.
     */
    public final Team team;

    /**
     * The health of the robot.
     */
    public final int health;

    /**
     * The current location of the robot.
     */
    public final MapLocation location;

    /**
     * The current paint amount of the robot.
     */
    public final int paintAmount;

    /**
     * Whether or not the robot is holding a flag.
     */
    public final boolean hasFlag;

    /**
     * The robot's current level in the attack skill.
     */
    public final int attackLevel;

    /**
     * The robot's current level in the heal skill.
     */
    public final int healLevel;

    /**
     * The robot's current level in the build skill.
     */
    public final int buildLevel;

    public RobotInfo(int ID, Team team, int health, MapLocation location, boolean hasFlag, int attackLevel, int healLevel, int buildLevel, int paintAmount) {
        super();
        this.ID = ID;
        this.team = team;
        this.health = health;
        this.location = location;
        this.hasFlag = hasFlag;
        this.attackLevel = attackLevel;
        this.healLevel = healLevel;
        this.buildLevel = buildLevel;
        this.paintAmount = paintAmount;
    }

    /**
     * Returns the ID of this robot.
     *
     * @return the ID of this robot
     */
    public int getID() {
        return this.ID;
    }

    /**
     * Returns the team that this robot is on.
     *
     * @return the team that this robot is on
     */
    public Team getTeam() {
        return team;
    }

    /**
     * Returns the health of this robot.
     *
     * @return the health of this robot
     */
    public int getHealth() {
        return health;
    }

    /**
     * Returns the location of this robot.
     *
     * @return the location of this robot
     */
    public MapLocation getLocation() {
        return this.location;
    }

    /**
     * Returns whether or not this robot has a flag. 
     * 
     * @return whether or not this robot has a flag
     */
    public boolean hasFlag() {
        return this.hasFlag;
    }

    /**
     * Returns the attack level of this robot. 
     * 
     * @return the attack level of the robot
     */
    public int getAttackLevel(){
        return this.attackLevel;
    }

    /**
     * Returns the heal level of this robot. 
     * 
     * @return the heal level of the robot
     */
    public int getHealLevel(){
        return this.healLevel;
    }

    /**
     * Returns the build level of this robot. 
     * 
     * @return the build level of the robot
     */
    public int getBuildLevel(){
        return this.buildLevel;
    }

    /**
     * Returns the paint amount of this robot. 
     * 
     * @return the paint amount of the robot
     */
    public int getPaintAmount(){
        return this.paintAmount;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        RobotInfo robotInfo = (RobotInfo) o;

        if (ID != robotInfo.ID) return false;
        if (team != robotInfo.team) return false;
        if (health != robotInfo.health) return false;
        return location.equals(robotInfo.location);
    }

    @Override
    public int hashCode() {
        int result;
        result = ID;
        result = 31 * result + team.hashCode();
        result = 31 * result + health;
        result = 31 * result + location.hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "RobotInfo{" +
                "ID=" + ID +
                ", team=" + team +
                ", health=" + health +
                ", location=" + location +
                ", paint amount=" + paintAmount +
                '}';
    }
}
