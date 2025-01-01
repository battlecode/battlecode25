package battlecode.doc;

import battlecode.instrumenter.TeamClassLoaderFactory;
import battlecode.instrumenter.bytecode.MethodCostUtil;
import com.sun.source.doctree.DocTree;
import javax.lang.model.element.Element;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.QualifiedNameable;
import jdk.javadoc.doclet.Taglet;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A taglet for the "battlecode.doc.costlymethod" annotation.
 * Only works on methods of classes in the battlecode package.
 */
@SuppressWarnings("unused")
public class CostlyMethodTaglet implements Taglet {

    public static final String TAG_NAME = "battlecode.doc.costlymethod";

    @SuppressWarnings("unused")
    public static void register(Map<String, Taglet> map) {
        map.put(TAG_NAME, new CostlyMethodTaglet());
    }

    @Override
    public Set<Taglet.Location> getAllowedLocations() {
        return Set.of(Taglet.Location.METHOD);
    }

    @Override
    public String getName() {
        return TAG_NAME;
    }

    @Override
    public boolean isInlineTag() {
        return false;
    }

    public String toString(Element element) {
        final String methodName = element.getSimpleName().toString();
        final QualifiedNameable enclosingType = (QualifiedNameable) element.getEnclosingElement();
        final String className = enclosingType.getQualifiedName().toString().replace('.', '/');

        final MethodCostUtil.MethodData data =
                MethodCostUtil.getMethodData(className, methodName);

        final int cost;

        if (data == null) {
            System.err.println("Warning: no method cost for method: " +
                    className + "/" + methodName + "; assuming 0");
            cost = 0;
        } else {
            cost = data.cost;
        }

        return "<dt><strong>Bytecode cost:</strong></dt><dd><code>"
                + cost +
                "</code></dd>";
    }

    public String toString(List<? extends DocTree> tags, Element element) {
        if (tags.size() != 1) {
            throw new IllegalArgumentException("Too many @"+TAG_NAME+"tags: "+tags.size());
        }

        return toString(element);
    }
}
