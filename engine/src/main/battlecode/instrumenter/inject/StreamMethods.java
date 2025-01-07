package battlecode.instrumenter.inject;

import java.lang.reflect.Method;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

@SuppressWarnings("unchecked")
public class StreamMethods {
    /**
     * Override the default stream toList() method. We do this because some stream
     * subclasses perform an indirect class access by calling Class.forName, which
     * does not load our instrumented classes. Therefore, we have to do it ourselves
     * to prevent this from happening.
     *
     * https://github.com/openjdk/jdk/blob/24c5ff7ba58cb7cf93df07f81484cd8fae60e31e/src/java.base/share/classes/java/util/stream/ReferencePipeline.java#L666
     */
    static public <T> List<T> toList(Object stream) {
        try {
            // Directly access the toArray method
            Method toArrayMethod = stream.getClass().getMethod("toArray");
            toArrayMethod.setAccessible(true);

            // Call toArray() and cast to a list
            T[] result = (T[]) toArrayMethod.invoke(stream);
            return (List<T>) Collections.unmodifiableList(new ArrayList<>(Arrays.asList(result)));

        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
