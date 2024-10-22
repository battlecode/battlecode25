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

    /** The minimum distance between ruins on the map */
    public static final int MIN_RUIN_SPACING_SQUARED = 25;

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

    /** Health each robot starts with */
    public static final int DEFAULT_HEALTH = 1000;

    /** Paint penalty for moving into enemy territory */
    public static final int PENALTY_ENEMY_TERRITORY = 2;

    /** Paint penalty for moving into neutral territory */
    public static final int PENALTY_NEUTRAL_TERRITORY = 1;

    /** The total number of robots a team has (both despawned or spawned). */
    public static final int ROBOT_CAPACITY = 50;

    /** Paint capacity for soldier robots */
    public static final int PAINT_CAPACITY_SOLDIER = 200;

    /** Paint capacity for splasher robots */
    public static final int PAINT_CAPACITY_SPLASHER = 300;

    /** Paint capacity for mopper robots */
    public static final int PAINT_CAPACITY_MOPPER = 100;

    /** The percent of the map which a team needs to paint to win. */
    public static final int PAINT_PERCENT_TO_WIN = 70;

    // *********************************
    // ****** GAME MECHANICS ***********
    // *********************************

    /** The number of towers a player starts with. */
    public static final int NUMBER_INITIAL_TOWERS = 3;

    /** Crumbs cost for digging. */
    public static final int DIG_COST = 20;
    
    /** Crumbs cost for filling */
    public static final int FILL_COST = 30;

    /** The width and height of the patterns that robots can draw */
    public static final int PATTERN_SIZE = 5;

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

    /** Maximum percent amount of paint to start cooldown */
    public static final int DECREASED_MOVEMENT_THRESHOLD = 50;

    /** Intercept in the formula for the cooldown */
    public static final int MOVEMENT_COOLDOWN_INTERCEPT = 100;

    /** Slope in the formula for the cooldown */
    public static final int MOVEMENT_COOLDOWN_SLOPE = -2;

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

    /** The maximum distance from a tower for building robots */
    public static final int BUILD_ROBOT_RADIUS_SQUARED = 4;

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

    /** The amount added to the action cooldown counter after a tower builds a robot */
    public static final int BUILD_ROBOT_COOLDOWN = 10;

    /** The amount added to the action cooldown counter after attacking */
    public static final int ATTACK_COOLDOWN = 20;

    /** The amount added to the action cooldown counter after healing */
    public static final int HEAL_COOLDOWN = 30;

    /** The amount added to the action cooldown counter after digging */
    public static final int DIG_COOLDOWN = 20;

    /** The amount added to the action cooldown counter after filling */
    public static final int FILL_COOLDOWN = 30;

    /** The maximum amount of bytes that can be encoded in a message  */
    public static final int MAX_MESSAGE_BYTES = 4;

    /** The maximum squared radius a robot can send a message to  */
    public static final int MESSAGE_RADIUS_SQUARED = 20;

    /** The maximum number of rounds a message will exist for */
    public static final int MESSAGE_ROUND_DURATION = 5;

    /** The maximum number of messages a robot can send per turn */
    public static final int MAX_MESSAGES_SENT_ROBOT = 1;

    /** The maximum number of messages a tower can send per turn */
    public static final int MAX_MESSAGES_SENT_TOWER = 20;
    
}
