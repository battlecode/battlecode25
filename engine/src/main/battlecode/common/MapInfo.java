package battlecode.common;

public class MapInfo {

    private MapLocation loc;

    private boolean isPassable;

    private boolean isWall;

    private boolean isDam;

    // 1 = Team A, 2 = Team B, 0 = not a spawn zone
    private int spawnZone;

    private boolean isWater;

    private int crumbsAmount;

    private Team territory;


    //TODO: update this method and usage (bobby pr)
    public MapInfo(MapLocation loc, boolean isPassable, boolean isWall, boolean isDam, int spawnZone, boolean isWater, int crumbsAmount, Team territory){
        this.loc = loc;
        this.isPassable = isPassable;
        this.isWall = isWall;
        this.isDam = isDam;
        this.spawnZone = spawnZone;
        this.isWater = isWater;
        this.crumbsAmount = crumbsAmount;
        this.territory = territory;
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
     * Returns if this square is a dam
     * 
     * @return whether this square is a dam
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean isDam() {
        return isDam;
    }

    /**
     * Returns if this square is a spawn zone.
     * 
     * @return whether this square is a spawn zone
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean isSpawnZone() {
        return spawnZone > 0;
    }

    /**
     * Returns 1 if this square is a Team A spawn zone,
     * 2 if this square is a Team B spawn zone, and
     * 0 if this square is not a spawn zone.
     * 
     * @return 1 or 2 if the square is a Team A or B spawn zone, respectively; 0 otherwise
     * 
     * @battlecode.doc.costlymethod
     */
    public int getSpawnZoneTeam() {
        return spawnZone;
    }

    /**
     * Returns the team that owns that spawn zone at this location, or Team.NEUTRAL if the location is not a spawn zone.
     * 
     * @return The team that owns the spawn zone, or Team.NEUTRAL
     * 
     * @battlecode.doc.costlymethod
     */
    public Team getSpawnZoneTeamObject() {
        return spawnZone == 0 ? Team.NEUTRAL : (spawnZone == 1 ? Team.A : Team.B);
    }

    /**
     * Returns if this square has water in it.
     * 
     * @return whether this square has water
     * 
     * @battlecode.doc.costlymethod
     */
    public boolean isWater() {
        return isWater;
    }

    /**
     * Returns the amount of crumbs on this square.
     * If there are no crumbs on the square, returns 0.
     * 
     * @return the amount of crumbs on the square
     * 
     * @battlecode.doc.costlymethod
     */
    public int getCrumbs() {
        return crumbsAmount;
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

    /**
     * Returns which team's territory this location is a part of. A location is in a team's territory
     * if it was accessible to that team's robots during the setup phase. Locations initially inaccessible to
     * either team will return Team.NEUTRAL.
     * 
     * @return The team territory that this location is a part of
     * 
     * @battlecode.doc.costlymethod
     */
    public Team getTeamTerritory() {
        return territory;
    }

    public String toString(){
        return "Location{" +
                "loc=" + loc +
                (isWall ? ", wall" : "") +
                (isWater ? ", water" : "") +
                (spawnZone == 1 ? ", team A spawn zone" : "") +
                (spawnZone == 2 ? ", team B spawn zone" : "") +
                (crumbsAmount == 0 ? "" : ", crumbs=" + crumbsAmount) +
                '}';
    }

}
