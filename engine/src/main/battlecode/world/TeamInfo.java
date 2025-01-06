package battlecode.world;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.Team;
import java.util.*;
import static battlecode.common.GameActionExceptionType.*;

/**
 * This class is used to hold information regarding team specific values such as
 * team names.
 */
public class TeamInfo {

    private GameWorld gameWorld;
    private int[] moneyCounts;
    private int[] totalPaintedSquares;
    private int[] totalNumberOfTowers;
    private int[] oldMoneyCounts;

    /**
     * Create a new representation of TeamInfo
     *
     * @param gameWorld the gameWorld the teams exist in
     */
    public TeamInfo(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
        this.moneyCounts = new int[2];
        this.oldMoneyCounts = new int[2];
        this.totalPaintedSquares = new int[2];
        this.totalNumberOfTowers = new int[2];
    }

    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    /**
     * Get the amount of money.
     * 
     * @param team the team to query
     * @return the team's money count
     */

    public int getMoney(Team team) {
        return this.moneyCounts[team.ordinal()];
    }

    /**
     * Get the total number of squares painted by the team over the game
     * @param team the team to query
     * @return the number of squares painted
     */

     public int getNumberOfPaintedSquares(Team team) {
        return this.totalPaintedSquares[team.ordinal()];
    }

    /**
     * Get the total number of towers belonging to a team
     * @param team the team to query
     * @return the number of towers the team has
     */

     public int getTotalNumberOfTowers(Team team) {
        return this.totalNumberOfTowers[team.ordinal()];
    }

    /**
     * Change the total number of squares painted by the team over the game
     * @param team the team to query
     */

     public void addPaintedSquares(int num, Team team) {
        this.totalPaintedSquares[team.ordinal()] += num;
        int areaWithoutWalls = this.gameWorld.getAreaWithoutWalls();
        if (this.totalPaintedSquares[team.ordinal()] / (double) areaWithoutWalls * 100 >= GameConstants.PAINT_PERCENT_TO_WIN) {
            checkWin(team);
        }
    }    

    /**
     * Change the total number of towers belonging to a team
     * @param team the team to query
     */

     public void addTowers(int num, Team team) {
        this.totalNumberOfTowers[team.ordinal()] += num;
    }    

    // *********************************
    // ***** UPDATE METHODS ************
    // *********************************

    /**
     * Add to the amount of money. If amount is negative, subtract from money
     * instead.
     * 
     * @param team   the team to query
     * @param amount the change in the money count
     * @throws IllegalArgumentException if the resulting amount of money is negative
     */
    public void addMoney(Team team, int amount) throws IllegalArgumentException {
        if (this.moneyCounts[team.ordinal()] + amount < 0) {
            throw new IllegalArgumentException("Invalid bread change");
        }
        this.moneyCounts[team.ordinal()] += amount;
    }

    private void checkWin(Team team) {
        int areaWithoutWalls = this.gameWorld.getAreaWithoutWalls();
        if (this.totalPaintedSquares[team.ordinal()] / (double) areaWithoutWalls * 100 < GameConstants.PAINT_PERCENT_TO_WIN) {
            throw new InternalError("Reporting incorrect win");
        }
        this.gameWorld.gameStats.setWinner(team);
        this.gameWorld.gameStats.setDominationFactor(DominationFactor.PAINT_ENOUGH_AREA);
    }

    public int getRoundMoneyChange(Team team) {
        return this.moneyCounts[team.ordinal()] - this.oldMoneyCounts[team.ordinal()];
    }

    public void processEndOfRound() {
        this.oldMoneyCounts[0] = this.moneyCounts[0];
        this.oldMoneyCounts[1] = this.moneyCounts[1];
    }


}
