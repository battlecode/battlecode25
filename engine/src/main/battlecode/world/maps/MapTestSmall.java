package battlecode.world.maps;

import battlecode.common.MapLocation;
import battlecode.common.Team;
import battlecode.world.GameMapIO;
import battlecode.world.LiveMap;
import battlecode.world.MapBuilder;
import battlecode.world.TestMapBuilder;
import battlecode.common.Direction;
import battlecode.common.GameConstants;

import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

/**
 * Generate a map.
 */
public class MapTestSmall {

    // change this!!!
    public static final String mapName = "maptestsmall";

    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        try {
            makeSimple();
        } catch (Exception e) {
            System.out.println(e);
        }
        System.out.println("Generated a map!");
    }

    public static void makeSimple() throws Exception {
        MapBuilder mapBuilder = new MapBuilder(mapName, 20, 20, 0, 0, 30);
        Random random = new Random(6147);

        Set<MapLocation> usedSquares = new HashSet<>();
        usedSquares.add(new MapLocation(5, 5));
        usedSquares.add(new MapLocation(8, 8));
        usedSquares.add(new MapLocation(2, 2));

        // Add 4 islands
        for (int i = 1; i < 3; i++) {
            int islandSize = random.nextInt(7) + 2;
            MapLocation nextLoc = new MapLocation(random.nextInt(14) + 2, random.nextInt(14) + 2);
            for (int j = 0; j < islandSize; j++) {
                if (usedSquares.contains(nextLoc)) {
                    continue;
                }
                // mapBuilder.setSymmetricIsland(nextLoc.x, nextLoc.y, i);
                usedSquares.add(nextLoc);
                nextLoc.add(Direction.cardinalDirections()[random.nextInt(Direction.cardinalDirections().length)]);
            }
        }

        for (int i = 0; i < mapBuilder.width / 2; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                MapLocation loc = new MapLocation(i, j);
                if (usedSquares.contains(loc)) {
                    continue;
                } else if ((i*13 + j*19 + random.nextInt(51)) % 43 == 0) {
                    if (i+3 >= mapBuilder.width || j+3 >= mapBuilder.height || usedSquares.contains(new MapLocation(i+3, j+3))) {
                        continue;
                    }
                    // mapBuilder.setSymmetricResource(i, j, 1);
                    // mapBuilder.setSymmetricResource(i + 3, j + 3, 2);
                    usedSquares.add(loc);
                    usedSquares.add(new MapLocation(i+3, j+3));
                } else if ((i*7 + j*21 + random.nextInt(51)) % 47 == 0) {
                    // mapBuilder.setSymmetricCloud(i, j, true);
                    MapLocation nextLoc = new MapLocation(i, j);
                    for (int k = 0; k < 5; k++) {
                        if (usedSquares.contains(nextLoc)) {
                            continue;
                        }
                        // mapBuilder.setSymmetricIsland(nextLoc.x, nextLoc.y, i);
                        usedSquares.add(nextLoc);
                        nextLoc.add(Direction.cardinalDirections()[random.nextInt(Direction.cardinalDirections().length)]);
                    }
                    usedSquares.add(loc);
                } else if ((i*11 + j*17 + random.nextInt(37)) % 23 == 0) {
                    mapBuilder.setSymmetricWalls(i, j, true);
                    usedSquares.add(loc);
                }
            }
        }

        mapBuilder.saveMap(outputDirectory);
    }
}
