package battlecode.common;

public class MapInfo {

    private MapLocation loc;

    private boolean isPassable;

    private boolean isWall;

    private int paint;

    private int mark;

    private boolean hasRuin;

    public MapInfo(MapLocation loc, boolean isPassable, boolean isWall, int paint, int mark, boolean hasRuin){
        this.loc = loc;
        this.isPassable = isPassable;
        this.isWall = isWall;
        this.paint = paint;
        this.mark = mark;
        this.hasRuin = hasRuin;
    }

    /**
     * Returns if this square is passable.
     * 
     * @return whether this square is passable
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean isPassable() {
        return isPassable;
    }

    /**
     * Returns if this square is a wall.
     * 
     * @return whether this square is a wall
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean isWall() {
        return isWall;
    }

    /**
     * Returns if this square has a ruin.
     * 
     * @return whether this square has a ruin
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean hasRuin() {
        return hasRuin;
    }

    /**
     * Returns the paint value of this square
     * 
     * @return the paint value of this square
     * 
     * @battlecode.doc.costlymethod
     */
    public int getPaint() {
        return paint;
    }

    /**
     * Returns the mark value of this square
     * 
     * @return the mark value of this square
     * 
     * @battlecode.doc.costlymethod
     */
    public int getMark() {
        return mark;
    }

    /**
     * Returns the location of this square
     * 
     * @return the location of this square
     * 
     * @battlecode.doc.costlymethod
     */
    public MapLocation getMapLocation() {
        return loc;
    }

    public String toString(){
        return "Location{" +
                "loc=" + loc +
                (isWall ? ", wall" : "") +
                (hasRuin ? ", with ruin" : "") +
                ", paint=" + Integer.toString(paint) + 
                ", mark=" + Integer.toString(mark) +
                "}";
    }
}
