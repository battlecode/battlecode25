package battlecode.common;

public enum RobotOrTowerType {
    SOLDIER(50),
    MOPPER(50);

    public final int paintCapacity;
    // TODO not implemented

    RobotOrTowerType(int paintCapacity) {
        this.paintCapacity = paintCapacity;
    }
}
