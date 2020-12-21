// automatically generated by the FlatBuffers compiler, do not modify

package battlecode.schema;

/**
 * Actions that can be performed.
 * Purely aesthetic; have no actual effect on simulation.
 * (Although the simulation may want to track the 'parents' of
 * particular robots.)
 * Actions may have 'targets', which are the units on which
 * the actions were performed.
 */
public final class Action {
  private Action() { }
  /**
   * Politicians self-destruct and affect nearby bodies
   * Target: none
   */
  public static final byte EMPOWER = 0;
  /**
   * Scandals turn into politicians.
   * Target: self.
   */
  public static final byte CAMOUFLAGE = 1;
  /**
   * Slanders are alowed to TODO.
   * Target: TODO.
   */
  public static final byte EMBEZZLE = 2;
  /**
   * Slanderers can expose a scandal.
   * Target: an enemy body.
   */
  public static final byte EXPOSE = 3;
  /**
   * Units can change their flag.
   * Target: self.
   */
  public static final byte SET_FLAG = 4;
  /**
   * Units can get the flag of another unit
   * Target: another unit.
   */
  public static final byte GET_FLAG = 5;
  /**
   * Builds a unit (enlightent center).
   * Target: spawned unit
   */
  public static final byte SPAWN_UNIT = 6;
  /**
   * Places a bid (enlightent center).
   * Target: bid placed
   */
  public static final byte PLACE_BID = 7;
  /**
   * A robot can change team after being empowered
   * Target: self
   */
  public static final byte CHANGE_TEAM = 8;
  /**
   * An enlightenment center can become neutral if lost all its influence
   * Target: none.
   */
  public static final byte BECOME_NEUTRAL = 9;
  /**
   * Dies due to an uncaught exception
   * Target: none
   */
  public static final byte DIE_EXCEPTION = 10;

  public static final String[] names = { "EMPOWER", "CAMOUFLAGE", "EMBEZZLE", "EXPOSE", "SET_FLAG", "GET_FLAG", "SPAWN_UNIT", "PLACE_BID", "CHANGE_TEAM", "BECOME_NEUTRAL", "DIE_EXCEPTION", };

  public static String name(int e) { return names[e]; }
}

