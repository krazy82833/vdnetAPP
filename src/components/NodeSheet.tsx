import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NodeItem, Region } from "../types";

type Props = {
  visible: boolean;
  regions: Region[];
  nodes: NodeItem[];
  expandedRegionId: string | null;
  selectedNodeId: string;
  onClose: () => void;
  onToggleRegion: (regionId: string) => void;
  onSelectNode: (node: NodeItem) => void;
  onLatencyTest: () => void;
};

export function NodeSheet({
  visible,
  regions,
  nodes,
  expandedRegionId,
  selectedNodeId,
  onClose,
  onToggleRegion,
  onSelectNode,
  onLatencyTest
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.grabber} />
      <View style={styles.sheetHeader}>
        <Text style={styles.title}>国家/地区</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="关闭节点列表" onPress={onClose}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.speedRow} onPress={onLatencyTest}>
          <View style={styles.speedIcon}>
            <Text style={styles.speedIconText}>✓</Text>
          </View>
          <View style={styles.speedCopy}>
            <Text style={styles.speedTitle}>延迟测速</Text>
            <Text style={styles.speedText}>测试当前地区列表中的 {nodes.length} 个节点</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {regions.map((region) => {
          const regionNodes = nodes.filter((node) => node.regionId === region.id);
          const expanded = expandedRegionId === region.id;

          return (
            <View key={region.id}>
              <Pressable style={styles.regionRow} onPress={() => onToggleRegion(region.id)}>
                <Text style={styles.flag}>{region.flag}</Text>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.chevron}>{expanded ? "⌄" : "›"}</Text>
              </Pressable>
              {expanded &&
                regionNodes.map((node) => (
                  <Pressable key={node.id} style={styles.nodeRow} onPress={() => onSelectNode(node)}>
                    <View style={styles.nodeFlagWrap}>
                      <Text style={styles.nodeFlag}>{region.flag}</Text>
                    </View>
                    <View style={styles.nodeCopy}>
                      <Text style={styles.nodeName}>{node.name}</Text>
                      <Text style={styles.nodeMeta}>
                        {node.city} · {node.protocol} · 负载 {node.load}%
                      </Text>
                    </View>
                    <Text style={[styles.latency, node.id === selectedNodeId && styles.selectedLatency]}>
                      {node.latencyMs}ms
                    </Text>
                  </Pressable>
                ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "64%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: "#8993a8",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d8dadd",
    marginBottom: 24
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: "#242830",
    fontSize: 26,
    fontWeight: "900"
  },
  close: {
    color: "#242830",
    fontSize: 46,
    lineHeight: 48
  },
  scrollArea: {
    marginTop: 18
  },
  scrollContent: {
    paddingBottom: 30
  },
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e6eb",
    paddingBottom: 20,
    gap: 16
  },
  speedIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "#e9fbef"
  },
  speedIconText: {
    color: "#42be63",
    fontSize: 28,
    fontWeight: "900"
  },
  speedCopy: {
    flex: 1
  },
  speedTitle: {
    color: "#2a2d33",
    fontSize: 21,
    fontWeight: "900"
  },
  speedText: {
    color: "#666a73",
    fontSize: 15,
    marginTop: 2
  },
  chevron: {
    color: "#767b84",
    fontSize: 42,
    fontWeight: "600"
  },
  regionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 78,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f1f4",
    gap: 16
  },
  flag: {
    width: 58,
    fontSize: 44
  },
  regionName: {
    flex: 1,
    color: "#2a2d33",
    fontSize: 25,
    fontWeight: "900"
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 48,
    gap: 14
  },
  nodeFlagWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#f5f6f9"
  },
  nodeFlag: {
    fontSize: 33
  },
  nodeCopy: {
    flex: 1
  },
  nodeName: {
    color: "#2a2d33",
    fontSize: 20,
    fontWeight: "900"
  },
  nodeMeta: {
    color: "#727782",
    fontSize: 14,
    marginTop: 4
  },
  latency: {
    color: "#5aa366",
    fontSize: 16,
    fontWeight: "800"
  },
  selectedLatency: {
    color: "#2f9cec"
  }
});

