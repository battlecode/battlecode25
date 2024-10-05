package battlecode.common;

/**
 * GameConstants defines constants that affect gameplay.
 */
@SuppressWarnings("unused")
public class GameConstants {

    /**
     * The current spec version the server compiles with.
     */
    public static final String SPEC_VERSION = "3.0.6";

    // *********************************
    // ****** MAP CONSTANTS ************
    // *********************************

    /** The minimum possible map height. */
    public static final int MAP_MIN_HEIGHT = 20;

    /** The maximum possible map height. */
    public static final int MAP_MAX_HEIGHT = 60;

    /** The minimum possible map width. */
    public static final int MAP_MIN_WIDTH = 20;

    /** The maximum possible map width. */
    public static final int MAP_MAX_WIDTH = 60;

    /** The minimum distance between ally flags in the initial map and at the end of the seutp phase */
    public static final int MIN_FLAG_SPACING_SQUARED = 36;

    // *********************************
    // ****** GAME PARAMETERS **********
    // *********************************

    /** The default game seed. **/
    public static final int GAME_DEFAULT_SEED = 6370;

    /** The maximum number of rounds in a game.  **/
    public static final int GAME_MAX_NUMBER_OF_ROUNDS = 2000;

    /** The maximum number of bytecodes a bot is allow to use in one turn */
    public static final int BYTECODE_LIMIT = 25000;

    /** The maximum length of indicator strings that a player can associate with a robot. */
    public static final int INDICATOR_STRING_MAX_LENGTH = 64;

    /** The length of each team's shared communication array. */
    public static final int SHARED_ARRAY_LENGTH = 64;

    /** The maximum value in shared communication arrays. */
    public static final int MAX_SHARED_ARRAY_VALUE = (1 << 16) - 1;

    /** The bytecode penalty that is imposed each time an exception is thrown. */
    public static final int EXCEPTION_BYTECODE_PENALTY = 500;

    /** health each robot starts with */
    public static final int DEFAULT_HEALTH = 1000;

    /** The total number of robots a team has (both despawned or spawned). */
    public static final int ROBOT_CAPACITY = 50;

    // *********************************
    // ****** GAME MECHANICS ***********
    // *********************************

    /** The number of flags a player starts with. */
    public static final int NUMBER_FLAGS = 3;

    /** Crumbs cost for digging. */
    public static final int DIG_COST = 20;
    
    /** Crumbs cost for filling */
    public static final int FILL_COST = 30;

    /** Number of rounds between updating the random noisy flag broadcast location */
    public static final int FLAG_BROADCAST_UPDATE_INTERVAL = 100;

    /** The maximum squared distance bewteen the actual flag location and the noisy broadcast location */
    public static final int FLAG_BROADCAST_NOISE_RADIUS = 100;

    /** The default number of rounds before dropped flags reset to their default locations */
    public static final int FLAG_DROPPED_RESET_ROUNDS = 4;

    /** The initial amount of crumbs each team starts with. */
    public static final int INITIAL_CRUMBS_AMOUNT = 400;

    /** The amount of crumbs each team gains per turn. */
    public static final int PASSIVE_CRUMBS_INCREASE = 10;

    /** The amount of crumbs you gain if your bot kills an enemy while in enemy territory */
    public static final int KILL_CRUMB_REWARD = 30;

    /** The end of the setup rounds in the game */
    public static final int SETUP_ROUNDS = 200;

    /** Number of rounds between adding a global upgrade point */
    public static final int GLOBAL_UPGRADE_ROUNDS = 600;

    /** The maximum distance from a robot where information can be sensed */
    public static final int VISION_RADIUS_SQUARED = 20;

    /** The maximum distance for attacking an enemy robot */
    public static final int ATTACK_RADIUS_SQUARED = 4;

    /** The maximum distance for healing an ally robot */
    public static final int HEAL_RADIUS_SQUARED = 4;

    /** The maximum distnace for picking up / dropping flags, building traps, digging, and filling */
    public static final int INTERACT_RADIUS_SQUARED = 2;

    // *********************************
    // ****** COOLDOWNS ****************
    // *********************************

    /** If the amount of cooldown is at least this value, a robot cannot act. */
    public static final int COOLDOWN_LIMIT = 10;

    /** The number of cooldown turns reduced per turn. */
    public static final int COOLDOWNS_PER_TURN = 10;

    /** The amount added to the movement cooldown counter when moving without a flag */
    public static final int MOVEMENT_COOLDOWN = 10;

    /** The amount added to the movement cooldown counter when moving while carrying a flag  */
    public static final int FLAG_MOVEMENT_COOLDOWN = 20;

    /** The amount added to the action cooldown counter after picking up or dropping a flag */
    public static final int PICKUP_DROP_COOLDOWN = 10;

    /** The amount added to the action cooldown counter after attacking */
    public static final int ATTACK_COOLDOWN = 20;

    /** The amount added to the action cooldown counter after healing */
    public static final int HEAL_COOLDOWN = 30;

    /** The amount added to the action cooldown counter after digging */
    public static final int DIG_COOLDOWN = 20;

    /** The amount added to the action cooldown counter after filling */
    public static final int FILL_COOLDOWN = 30;

}
