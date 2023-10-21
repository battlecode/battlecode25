package battlecode.world;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.ResourceType;
import battlecode.common.Team;
import java.util.*;
import static battlecode.common.GameActionExceptionType.*;

/**
 * This class is used to hold information regarding team specific values such as
 * team names.
 */
public class TeamInfo {

    private GameWorld gameWorld;
    private MapLocation[] headquarters;
    // private int[] elixirCounts;
    // private int[] manaCounts;
    private int[] breadCounts; 
    private int[][] sharedArrays; 
    private int[] totalFlagsCaptured;
    private int[] currentFlagsCaptured;

    // for reporting round statistics to client
    //private int[] oldElixirCounts;
    //private int[] oldManaCounts;
    private int[] oldBreadCounts;

    /**
     * Create a new representation of TeamInfo
     *
     * @param gameWorld the gameWorld the teams exist in
     */
    public TeamInfo(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
        //this.elixirCounts = new int[2];
        //this.manaCounts = new int[2];
        this.breadCounts = new int[2];
        this.sharedArrays = new int[2][GameConstants.SHARED_ARRAY_LENGTH];
        this.totalFlagsCaptured = new int[2];
        this.currentFlagsCaptured = new int[2];
        //this.oldElixirCounts = new int[2];
        //this.oldManaCounts = new int[2];
        this.oldBreadCounts = new int[2];
    }
    
    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    /**
     * Get the amount of elixir.
     *
     * @param team the team to query
     * @return the team's elixir count
     
    public int getElixir(Team team) {
        return this.elixirCounts[team.ordinal()];
    }
    */

    /**
     * Get the amount of mana.
     *
     * @param team the team to query
     * @return the team's mana count
     
    public int getMana(Team team) {
        return this.manaCounts[team.ordinal()];
    }
    */

    /**
     * Get the amount of adamantium.
     * 
     * @param team the team to query
     * @return the team's adamantium count
     */
    public int getBread(Team team) {
    	return this.breadCounts[team.ordinal()];
    }

    /**
     * Get the total number of anchors placed by the team over the game
     * @param team the team to query
     * @return the total anchors placed
     */
    public int getFlagsCaptured(Team team) {
        return this.totalFlagsCaptured[team.ordinal()];
    }
    
    /**
     * Reads the shared array value.
     *
     * @param team the team to query
     * @param index the index in the array
     * @return the value at that index in the team's shared array
     */
    public int readSharedArray(Team team, int index) {
        return this.sharedArrays[team.ordinal()][index];
    }

    // *********************************
    // ***** UPDATE METHODS ************
    // *********************************

    /**
     * Add to the amount of elixir. If amount is negative, subtract from elixir instead. 
     * 
     * @param team the team to query
     * @param amount the change in the elixir count
     * @throws IllegalArgumentException if the resulting amount of elixir is negative
     
    public void addElixir(Team team, int amount) throws IllegalArgumentException {
        if (this.elixirCounts[team.ordinal()] + amount < 0) {
            throw new IllegalArgumentException("Invalid elixir change");
        }
        this.elixirCounts[team.ordinal()] += amount;
    }
    */

    /**
     * Add to the amount of mana. If amount is negative, subtract from mana instead. 
     * 
     * @param team the team to query
     * @param amount the change in the mana count
     * @throws IllegalArgumentException if the resulting amount of mana is negative
     
    public void addMana(Team team, int amount) throws IllegalArgumentException {
        if (this.manaCounts[team.ordinal()] + amount < 0) {
            throw new IllegalArgumentException("Invalid mana change");
        }
        this.manaCounts[team.ordinal()] += amount;
    }
    */
    
    /**
     * Add to the amount of adamantium. If amount is negative, subtract from adamantium instead.
     * 
     * @param team the team to query
     * @param amount the change in the mana count
     * @throws IllegalArgumentException if the resulting amount of adamantium is negative
     */
    public void addBread(Team team, int amount) throws IllegalArgumentException {
    	if (this.breadCounts[team.ordinal()] + amount < 0) {
    		throw new IllegalArgumentException("Invalid adamantium change");
    	}
    	this.breadCounts[team.ordinal()] += amount;
    }

    public void addResource(Team team, int amount) throws IllegalArgumentException {
        addBread(team, amount);
        /*
        switch (rType) {
             case ADAMANTIUM:
                addAdamantium(team, amount);
                break;
            case MANA:
                addMana(team, amount);
                break;
                
            case BREAD:
                addBread(team, amount);
                break;
            case NO_RESOURCE:
                if (amount != 0)
                    throw new IllegalArgumentException("Can't add no resource");
                break;
                */
        }
    }

    private int numIslandsOccupied(Team team){
        int islandsOwned = 0;
        for(Island island: gameWorld.getAllIslands()){
            if(island.getTeam() == team)
                islandsOwned++;
        }
        return islandsOwned;
    }

    private void checkWin (Team team){ 
        int islandsOwned = numIslandsOccupied(team);
        if (((float)islandsOwned)/gameWorld.getAllIslands().length < GameConstants.WIN_PERCENTAGE_OF_ISLANDS_OCCUPIED) {
            throw new InternalError("Reporting incorrect win");
        }
        this.gameWorld.gameStats.setWinner(team);
        this.gameWorld.gameStats.setDominationFactor(DominationFactor.CONQUEST);
    }

    /**
     * Increments both anchors placed counter for the team
     * @param team the team to query
     */
    public void captureFlag(Team team) {
        this.totalFlagsCaptured[team.ordinal()]++;
        this.currentFlagsCaptured[team.ordinal()]++;
        if (((float)this.currentFlagsCaptured[team.ordinal()])/gameWorld.getAllIslands().length >= GameConstants.WIN_PERCENTAGE_OF_ISLANDS_OCCUPIED) {
            checkWin(team); // Do an extra check to make sure the win is correct
        }
    }

    /**
     * Decrements the current anchors placed counter for the team
     * @param team the team to query
     */
    public void removeAnchor(Team team) {
        this.currentFlagsCaptured[team.ordinal()]--;
    }

    /**
     * Sets an index in the team's shared array to a given value.
     *
     * @param team the team to query
     * @param index the index in the shared array
     * @param value the new value
     */
    public void writeSharedArray(Team team, int index, int value) {
        this.sharedArrays[team.ordinal()][index] = value;
    }

    /*
    public int getRoundElixirChange(Team team) {
        return this.elixirCounts[team.ordinal()] - this.oldElixirCounts[team.ordinal()];
    }

    public int getRoundManaChange(Team team) {
        return this.manaCounts[team.ordinal()] - this.oldManaCounts[team.ordinal()];
    }
    */
    
    public int getRoundBreadChange(Team team) {
    	return this.breadCounts[team.ordinal()] - this.oldBreadCounts[team.ordinal()];
    }

    public void processEndOfRound() {
        /*
        this.oldElixirCounts[0] = this.elixirCounts[0];
        this.oldElixirCounts[1] = this.elixirCounts[1];
        this.oldManaCounts[0] = this.manaCounts[0];
        this.oldManaCounts[1] = this.manaCounts[1];
        */
        this.oldBreadCounts[0] = this.breadCounts[0];
        this.oldBreadCounts[1] = this.breadCounts[1];
    }


}
