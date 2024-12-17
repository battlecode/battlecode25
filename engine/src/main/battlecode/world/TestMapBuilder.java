package battlecode.world;

import battlecode.common.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Lets maps be built easily, for testing purposes.
 */
public class TestMapBuilder {
    private MapBuilder mapBuilder;

    public TestMapBuilder(String name, int oX, int oY, int width, int height, int seed) {
        this.mapBuilder = new MapBuilder(name, width, height, oX, oY, seed);
    }
    
    // public TestMapBuilder setWall(int x, int y, boolean value) {
    //     this.mapBuilder.setWall(x, y, value);
    //     return this;
    // }

    // public TestMapBuilder setResource(int x, int y, int value) {
    //     this.mapBuilder.setResource(x, y, value);
    //     return this;
    // }

    // public TestMapBuilder setIsland(int x, int y, int value) {
    //     this.mapBuilder.setIsland(x, y, value);
    //     return this;
    // }

    public LiveMap build() {
        return this.mapBuilder.build();
    }
}
