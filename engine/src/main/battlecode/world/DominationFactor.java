package battlecode.world;

/**
 * Determines roughly by how much the winning team won.
 */
public enum DominationFactor {
    /**
     * Win by painting more than {@value battlecode.common.GameConstants#PAINT_PERCENT_TO_WIN}% of the map.
     */
    PAINT_ENOUGH_AREA,
    /**
     * Win by having more squares painted than the other team at the end of the game (tiebreak 1).
     */
    MORE_SQUARES_PAINTED,
    /**
     * Win by having more allied towers alive at the end of the game (tiebreak 2).
     */
    MORE_TOWERS_ALIVE,
    /**
     * Win by having more money at the end of the game (tiebreak 3).
     */
    MORE_MONEY,
    /**
     * Win by having more paint stored in robots and towers (tiebreak 4).
     */
    MORE_PAINT_IN_UNITS,
    /**
     * Win by having more units currently alive at the end of the game (tiebreak 5).
     */
    MORE_UNITS,
    /**
     * Win by coinflip (tiebreak 6).
     */
    WON_BY_DUBIOUS_REASONS,
    /**
     * Win because the other team resigns.
     */
    RESIGNATION;
}
