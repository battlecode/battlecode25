package battlecode.world;

import battlecode.common.GameConstants;

public class Message {
    private static int globalID = 0;
    private int id;
    private char[] bytes;

    public Message(char[] bytes){
        globalID ++;
        this.id = globalID;
        this.bytes = new char[MAX_MESSAGE_BYTES];
        for(int i = 0; i < Math.min(MAX_MESSAGE_BYTES, bytes.length); i ++)
            this.bytes[i] = bytes[i];
    }

    public int getId() {
        return id;
    }

    public char[] getBytes(){
        return this.bytes;
    }

    public String toString(){
        return "";
    }
}
