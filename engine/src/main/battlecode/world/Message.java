package battlecode.world;

import battlecode.common.GameConstants;

public class Message {
    private int senderID;
    private int round;
    private int bytes;

    public Message(int bytes, int senderID, int round){
        this.senderID = senderID;
        this.round = round;
        this.bytes = bytes;
    }

    public int getSenderID() {
        return senderID;
    }

    public int getRound() {
        return round;
    }

    public int getBytes() {
        return this.bytes;
    }

    public String toString() {
        return "Message with value " + toString(bytes) + " sent from robot with ID " + toString(senderID) + " during round " + toString(round) + ".";
    }

    public Message copy() {
        return new Message(bytes, senderID, round);
    }
}
