package battlecode.world;

import battlecode.common.*;
import battlecode.schema.*;
import battlecode.util.FlatHelpers;
import battlecode.util.TeamMapping;
import gnu.trove.list.array.TIntArrayList;

import com.google.flatbuffers.FlatBufferBuilder;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.mapping.Map;

import java.io.*;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * This class contains the code for reading a flatbuffer map file and converting it
 * to a proper LiveMap.
 */
public final strictfp class GameMapIO {
    /**
     * The loader we use if we can't find a map in the correct path.
     */
    private static final ClassLoader BACKUP_LOADER = GameMapIO.class.getClassLoader();

    /**
     * The file extension for battlecode 2025 match files.
     */
    public static final String MAP_EXTENSION = ".map25";

    /**
     * The package we check for maps in if they can't be found in the file system.
     */
    public static final String DEFAULT_MAP_PACKAGE = "battlecode/world/resources/";

    /**
     * Returns a LiveMap for a specific map.
     * If the map can't be found in the given directory, the package
     * "battlecode.world.resources" is checked as a backup.
     *
     * @param mapName name of map.
     * @param mapDir directory to load the extra map from; may be null.
     * @return LiveMap for map
     * @throws IOException if the map fails to load or can't be found.
     */
    public static LiveMap loadMap(String mapName, File mapDir, boolean teamsReversed) throws IOException {
        final LiveMap result;

        final File mapFile = new File(mapDir, mapName + MAP_EXTENSION);
        if (mapFile.exists()) {
            result = loadMap(new FileInputStream(mapFile), teamsReversed);
        } else {
            final InputStream backupStream = BACKUP_LOADER.getResourceAsStream(DEFAULT_MAP_PACKAGE + mapName + MAP_EXTENSION);
            if (backupStream == null) {
                throw new IOException("Can't load map: " + mapName + " from dir " + mapDir + " or default maps.");
            }
            result = loadMap(backupStream, teamsReversed);
        }

        if (!result.getMapName().equals(mapName)) {
            throw new IOException("Invalid map: name (" + result.getMapName()
                    + ") does not match filename (" + mapName + MAP_EXTENSION + ")"
            );
        }

        return result;
    }

    public static LiveMap loadMapAsResource(final ClassLoader loader,
                                            final String mapPackage,
                                            final String map, final boolean teamsReversed) throws IOException {
        final InputStream mapStream = loader.getResourceAsStream(
                mapPackage + (mapPackage.endsWith("/")? "" : "/") +
                map + MAP_EXTENSION
        );

        if (mapStream == null) {
            throw new IOException("Can't load map: " + map + " from package " + mapPackage);
        }

        final LiveMap result = loadMap(mapStream, teamsReversed);

        if (!result.getMapName().equals(map)) {
            throw new IOException("Invalid map: name (" + result.getMapName()
                    + ") does not match filename (" + map + MAP_EXTENSION + ")"
            );
        }

        return result;
    }

    /**
     * Load a map from an input stream.
     *
     * @param stream the stream to read from; will be closed after the map is read.
     * @return a map read from the stream
     * @throws IOException if the read fails somehow
     */
    public static LiveMap loadMap(InputStream stream, boolean teamsReversed) throws IOException {
        return Serial.deserialize(IOUtils.toByteArray(stream), teamsReversed);
    }

    /**
     * Write a map to a file.
     *
     * @param mapDir the directory to store the map in
     * @param map the map to write
     * @throws IOException if the write fails somehow
     */
    public static void writeMap(LiveMap map, File mapDir) throws IOException {
        final File target = new File(mapDir, map.getMapName() + MAP_EXTENSION);

        IOUtils.write(Serial.serialize(map), new FileOutputStream(target));
    }

    /**
     * @param mapDir the directory to check for extra maps. May be null.
     * @return a set of available map names, including those built-in to battlecode-server.
     */
    public static List<String> getAvailableMaps(File mapDir) {
        final List<String> result = new ArrayList<>();

        // Load maps from the extra directory
        if (mapDir != null) {
            if (mapDir.isDirectory()) {
                // Files in directory
                for (File file : mapDir.listFiles()) {
                    String name = file.getName();
                    if (name.endsWith(MAP_EXTENSION)) {
                        result.add(name.substring(0, name.length() - MAP_EXTENSION.length()));
                    }
                }
            }
        }

        // Load built-in maps
        URL serverURL = GameMapIO.class.getProtectionDomain().getCodeSource().getLocation();
        try {
            if (GameMapIO.class.getResource("GameMapIO.class").getProtocol().equals("jar")) {
                // We're running from a jar file.
                final ZipInputStream serverJar = new ZipInputStream(serverURL.openStream());

                ZipEntry ze;
                while ((ze = serverJar.getNextEntry()) != null) {
                    final String name = ze.getName();
                    if (name.startsWith(DEFAULT_MAP_PACKAGE) && name.endsWith(MAP_EXTENSION)) {
                        result.add(
                                name.substring(DEFAULT_MAP_PACKAGE.length(), name.length() - MAP_EXTENSION.length())
                        );
                    }
                }
            } else {
                // We're running from class files.
                final String[] resourceFiles = new File(BACKUP_LOADER.getResource(DEFAULT_MAP_PACKAGE).toURI()).list();

                for (String file : resourceFiles) {
                    if (file.endsWith(MAP_EXTENSION)) {
                        result.add(file.substring(0, file.length() - MAP_EXTENSION.length()));
                    }
                }
            }
        } catch (IOException | URISyntaxException e) {
            System.err.println("Can't load default maps: " + e.getMessage());
            e.printStackTrace();
        }

        Collections.sort(result);
        return result;
    }

    /**
     * Prevent instantiation.
     */
    private GameMapIO() {}

    /**
     * Conversion from / to flatbuffers.
     */
    public static class Serial {
        /**
         * Load a flatbuffer map into a LiveMap.
         *
         * @param mapBytes the raw bytes of the map
         * @return a new copy of the map as a LiveMap
         */
        public static LiveMap deserialize(byte[] mapBytes, boolean teamsReversed) {
            battlecode.schema.GameMap rawMap = battlecode.schema.GameMap.getRootAsGameMap(
                    ByteBuffer.wrap(mapBytes)
            );

            return Serial.deserialize(rawMap, teamsReversed);
        }

        /**
         * Write a map to a byte[].
         *
         * @param gameMap the map to write
         * @return the map as a byte[]
         */
        public static byte[] serialize(LiveMap gameMap) {
            FlatBufferBuilder builder = new FlatBufferBuilder();

            int mapRef = Serial.serialize(builder, gameMap);

            builder.finish(mapRef);

            return builder.sizedByteArray();
        }

        /**
         * Load a flatbuffer map into a LiveMap.
         *
         * @param raw the flatbuffer map pointer
         * @return a new copy of the map as a LiveMap
         */
        public static LiveMap deserialize(battlecode.schema.GameMap raw, boolean teamsReversed) {
            final int width = (int) (raw.size().x());
            final int height = (int) (raw.size().y());
            final MapLocation origin = new MapLocation(0,0);
            final MapSymmetry symmetry = MapSymmetry.values()[raw.symmetry()];
            final int seed = raw.randomSeed();
            final int rounds = GameConstants.GAME_MAX_NUMBER_OF_ROUNDS;
            final String mapName = raw.name();
            int size = width*height;
            boolean[] wallArray = new boolean[size];
            boolean[] waterArray = new boolean[size];
            boolean[] damArray = new boolean[size];
            int[] breadArray = new int[size];
            int[] spawnZoneArray = new int[size];

            for (int i = 0; i < wallArray.length; i++) {
                wallArray[i] = raw.walls(i);
                waterArray[i] = raw.water(i);
                damArray[i] = raw.divider(i);
            }
            battlecode.schema.VecTable resourcePiles = raw.resourcePiles();
            int num_piles = resourcePiles.xsLength();
            for (int i = 0; i < num_piles; i++){
                MapLocation cur = new MapLocation(resourcePiles.xs(i), resourcePiles.ys(i));
                int amt = raw.resourcePileAmounts(i);
                // support older maps by multiplying crumbs by 10 if value is low
                if(amt < 100) amt *= 10;
                breadArray[cur.x+cur.y*width] = amt;
            }

            battlecode.schema.VecTable spawnZoneCentersTable = raw.spawnLocations();
            for (int i = 0; i < 6; i++){
                MapLocation cur = new MapLocation(spawnZoneCentersTable.xs(i), spawnZoneCentersTable.ys(i));
                for (MapLocation loc : GameWorld.getAllLocationsWithinRadiusSquaredWithoutMap(origin, width, height, cur, 2)){
                    spawnZoneArray[loc.x + loc.y*width] = (i % 2 == 0) ? 1 : 2;
                }
            }

            return new LiveMap(
                width, height, origin, seed, rounds, mapName, symmetry, wallArray, waterArray, damArray, breadArray, spawnZoneArray);
        }


        /**
         * Write a map to a builder.
         *
         * @param builder the target builder
         * @param gameMap the map to write
         * @return the object reference to the map in the builder
         */
        public static int serialize(FlatBufferBuilder builder, LiveMap gameMap) {
            int name = builder.createString(gameMap.getMapName());
            int randomSeed = gameMap.getSeed();
            boolean[] wallArray = gameMap.getWallArray();
            boolean[] waterArray = gameMap.getWaterArray();
            boolean[] damArray = gameMap.getDamArray();
            int[] breadArray = gameMap.getBreadArray();
            int[][] spawnZoneCenters = gameMap.getSpawnZoneCenters();
            TIntArrayList spawnZoneCenterXs = new TIntArrayList(spawnZoneCenters[0]);
            TIntArrayList spawnZoneCenterYs = new TIntArrayList(spawnZoneCenters[1]);


            // Make body tables
            ArrayList<Boolean> wallArrayList = new ArrayList<>();
            ArrayList<Boolean> waterArrayList = new ArrayList<>();
            ArrayList<Boolean> damArrayList = new ArrayList<>();
            ArrayList<Integer> breadArrayList = new ArrayList<>();
            ArrayList<Integer> breadLocationsArrayList = new ArrayList<>();

            for (int i = 0; i < gameMap.getWidth() * gameMap.getHeight(); i++) {
                wallArrayList.add(wallArray[i]);
                waterArrayList.add(waterArray[i]);
                damArrayList.add(damArray[i]);
                if (breadArray[i] != 0){
                    breadArrayList.add(breadArray[i]);
                    breadLocationsArrayList.add(i);
                }
            }
            int[] breadLocationXs = new int[breadLocationsArrayList.size()];
            int[] breadLocationYs = new int[breadLocationsArrayList.size()];
            for (int i = 0; i < breadLocationsArrayList.size(); i++){
                MapLocation loc = gameMap.indexToLocation(breadLocationsArrayList.get(i));
                breadLocationXs[i] = loc.x;
                breadLocationYs[i] = loc.y;
            }
            TIntArrayList breadLocationXsList = new TIntArrayList(breadLocationXs);
            TIntArrayList breadLocationYsList = new TIntArrayList(breadLocationYs);

            int wallArrayInt = battlecode.schema.GameMap.createWallsVector(builder, ArrayUtils.toPrimitive(wallArrayList.toArray(new Boolean[wallArrayList.size()])));
            int waterArrayInt = battlecode.schema.GameMap.createWaterVector(builder, ArrayUtils.toPrimitive(waterArrayList.toArray(new Boolean [waterArrayList.size()])));
            int damArrayInt = battlecode.schema.GameMap.createDividerVector(builder, ArrayUtils.toPrimitive(damArrayList.toArray(new Boolean[damArrayList.size()])));
            int breadArrayInt = battlecode.schema.GameMap.createResourcePileAmountsVector(builder, ArrayUtils.toPrimitive(breadArrayList.toArray(new Integer[breadArrayList.size()])));
            
            int spawnLocations = FlatHelpers.createVecTable(builder, spawnZoneCenterXs, spawnZoneCenterYs);
            int resourcePiles = FlatHelpers.createVecTable(builder, breadLocationXsList, breadLocationYsList);

            int spawnedRobotsP = SpawnedBodyTable.createRobotIdsVector(builder, new int[0]);
            int spawnedTeamsP = SpawnedBodyTable.createTeamIdsVector(builder, new byte[0]);
            int spawnedLocsP = FlatHelpers.createVecTable(builder, new TIntArrayList(), new TIntArrayList());
            SpawnedBodyTable.startSpawnedBodyTable(builder);
            SpawnedBodyTable.addRobotIds(builder, spawnedRobotsP);
            SpawnedBodyTable.addTeamIds(builder, spawnedTeamsP);
            SpawnedBodyTable.addLocs(builder, spawnedLocsP);
            int spawnedBodies = SpawnedBodyTable.endSpawnedBodyTable(builder);

            // Build LiveMap for flatbuffer
            battlecode.schema.GameMap.startGameMap(builder);
            battlecode.schema.GameMap.addName(builder, name);

            //this might be backwards
            battlecode.schema.GameMap.addSize(builder, Vec.createVec(builder, gameMap.getWidth(), gameMap.getHeight()));

            battlecode.schema.GameMap.addSymmetry(builder, gameMap.getSymmetry().ordinal());
            battlecode.schema.GameMap.addRandomSeed(builder, randomSeed);
            battlecode.schema.GameMap.addWalls(builder, wallArrayInt);
            battlecode.schema.GameMap.addSpawnLocations(builder, spawnLocations);
            battlecode.schema.GameMap.addBodies(builder, spawnedBodies);
            battlecode.schema.GameMap.addWater(builder, waterArrayInt);
            battlecode.schema.GameMap.addDivider(builder, damArrayInt);
            battlecode.schema.GameMap.addResourcePiles(builder, resourcePiles);
            battlecode.schema.GameMap.addResourcePileAmounts(builder, breadArrayInt);
            return battlecode.schema.GameMap.endGameMap(builder);
        }

        // ****************************
        // *** HELPER METHODS *********
        // ****************************

    }
}
