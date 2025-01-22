package battlecode.common;

import battlecode.instrumenter.inject.RobotMonitor;

/**
 * Clock is a singleton that allows contestants to introspect the state of their
 * running code.
 *
 * @author james
 */
@SuppressWarnings("unused")
public final class Clock {
    /*
     * IMPORTANT NOTE!
     * This class is reloaded for every individual robot.
     * See Loader for more information.
     */

    /**
     * Ends the processing of this robot during the current round. Never fails.
     *
     * @battlecode.doc.costlymethod
     */
    public static void yield() {
        RobotMonitor.pause();
    }

    /**
     * Returns the number of bytecodes this robot has left in this round.
     *
     * @return the number of bytecodes this robot has left in this round
     * @battlecode.doc.costlymethod
     */
    public static int getBytecodesLeft() {
        return RobotMonitor.getBytecodesLeft();
    }

    /**
     * Returns the number of bytecodes the current robot has executed since the
     * beginning of the current round.
     *
     * @return the number of bytecodes the current robot has executed since the
     *         beginning of the current round
     * @battlecode.doc.costlymethod
     */
    public static int getBytecodeNum() {
        return RobotMonitor.getBytecodeNum();
    }

    /**
     * Returns the total amount of execution time left this team has before they timeout
     *
     * @return the amount of execution time remaining, in nanoseconds
     * @battlecode.doc.costlymethod
     */
    public static long getTimeLeft() {
        return RobotMonitor.getTimeLeft();
    }

    /**
     * Returns the total amount of time that this team's robots have collectively spent executing
     * since the beginning of the match.
     *
     * @return the total execution time, in nanoseconds
     * @battlecode.doc.costlymethod
     */
    public static long getTimeElapsed() {
        return RobotMonitor.getTimeElapsed();
    }

    /**
     * Prevent construction.
     */
    private Clock() {}
}
