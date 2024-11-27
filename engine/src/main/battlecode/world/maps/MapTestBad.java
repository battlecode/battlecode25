package battlecode.world.maps;

import java.io.IOException;

import battlecode.common.MapLocation;
import battlecode.common.Team;
import battlecode.world.*;

public class MapTestBad {
    public static void main(String[] args){
        System.out.println("running!");
        try{
        makeBad();
        }
        catch (Exception e){
            System.out.println(e);
        }
        System.out.println("create a map!!");
    }

    public static void makeBad() throws Exception{
        MapBuilder builder = new MapBuilder("bad", 20, 20, 0, 0, 3);
        builder.addTower(1, Team.A, new MapLocation(0,0));
        builder.addTower(11, Team.A, new MapLocation(1,1));
        builder.addTower(21, Team.A, new MapLocation(2,2));
        builder.addTower(2, Team.B, new MapLocation(10,10));
        builder.addTower(22, Team.B, new MapLocation(11,11));
        builder.addTower(2222, Team.B, new MapLocation(12,12));
        builder.build();
        builder.saveMap("engine/src/main/battlecode/world/resources/");

    }
}
