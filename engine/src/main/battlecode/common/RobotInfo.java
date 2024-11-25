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
     * The type of the robot.
     */
    public final UnitType type;

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


    public RobotInfo(int ID, Team team, UnitType type, int health, MapLocation location, int paintAmount) {
        super();
        this.ID = ID;
        this.team = team;
        this.type = type;
        this.health = health;
        this.location = location;
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
     * Returns this robot's type.
     * 
     * @return the type of this robot.
     */
    public UnitType getType(){
        return this.type;
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
