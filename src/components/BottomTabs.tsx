import { Pressable, StyleSheet, Text, View } from "react-native";
import { TabKey } from "../types";

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "首页", icon: "⌂" },
  { key: "invite", label: "邀请", icon: "▣" },
  { key: "stats", label: "统计", icon: "◔" },
  { key: "profile", label: "我的", icon: "⚙" }
];

type Props = {
  current: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomTabs({ current, onChange }: Props) {
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.icon, active && styles.active]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eef0f4",
    backgroundColor: "#ffffff",
    paddingBottom: 12,
    paddingTop: 8
  },
  tab: {
    alignItems: "center",
    minWidth: 64,
    gap: 2
  },
  icon: {
    color: "#8d8f95",
    fontSize: 31,
    fontWeight: "900"
  },
  label: {
    color: "#8d8f95",
    fontSize: 14,
    fontWeight: "700"
  },
  active: {
    color: "#2f9cec"
  }
});

