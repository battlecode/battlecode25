package battlecode.common;

public enum PaintType {
    EMPTY,
    ALLY_PRIMARY,
    ALLY_SECONDARY,
    ENEMY_PRIMARY,
    ENEMY_SECONDARY;

    public boolean isAlly() {
        return this == ALLY_PRIMARY || this == ALLY_SECONDARY;
    }

    public boolean isPrimary() {
        return this == ALLY_PRIMARY || this == ENEMY_PRIMARY;
    }
}
