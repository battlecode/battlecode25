package battlecode.world;

import battlecode.common.GameConstants;

public class Message {
    private int senderID;
    private int round;
    private int bytes;
    private boolean isDeleted;

    public Message(int bytes, int senderID, int round){
        this.senderID = senderID;
        this.round = round;
        this.bytes = bytes;
        this.isDeleted = false;
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

    public void delete() {
        this.isDeleted = true;
        this.senderID = -1;
        this.bytes = -1;
        this.round = -1;
    }
}
