import { StyleSheet, Text, View } from "react-native";
import { brandCopy, brandTheme } from "../theme/brand";

type Props = {
  compact?: boolean;
};

const features = [
  {
    title: `${brandCopy.coreName} 自研核心`,
    body: "Rust 原生阶段预留桥接层，当前 Expo 版已经通过统一 Core API 驱动连接状态。"
  },
  {
    title: `${brandCopy.pulseName} 节点地图`,
    body: "节点延迟、地区、状态集中展示，延续地图化选择与一键连接体验。"
  },
  {
    title: "多面板适配",
    body: "PPANEL 已接入，架构预留 V2Board、XBoard/X2Board、SSP 适配器。"
  }
];

export function ProductShowcase({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{brandCopy.labName}</Text>
        <Text style={styles.badgeMuted}>{brandCopy.platformLine}</Text>
      </View>
      <Text style={[styles.title, compact && styles.compactTitle]}>{brandCopy.heroTitle}</Text>
      <Text style={styles.subtitle}>{brandCopy.heroSubtitle}</Text>

      <View style={styles.featureGrid}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <View style={styles.featureMark} />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureBody}>{feature.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RuntimePill({ nativeReady }: { nativeReady: boolean }) {
  return (
    <View style={styles.runtimePill}>
      <Text style={styles.runtimeLabel}>Core</Text>
      <Text style={styles.runtimeValue}>{nativeReady ? "Native Rust Ready" : "Expo Bridge Preview"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: brandTheme.border,
    borderRadius: 24,
    backgroundColor: brandTheme.surface,
    padding: 18,
    shadowColor: brandTheme.blue,
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 4
  },
  compactWrap: {
    borderRadius: 20,
    marginBottom: 14
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: brandTheme.navy,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeMuted: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: brandTheme.border,
    borderRadius: 999,
    color: brandTheme.blueDeep,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  title: {
    color: brandTheme.navy,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 41
  },
  compactTitle: {
    fontSize: 24,
    lineHeight: 30
  },
  subtitle: {
    color: brandTheme.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 10
  },
  featureGrid: {
    gap: 10,
    marginTop: 16
  },
  featureCard: {
    borderWidth: 1,
    borderColor: brandTheme.border,
    borderRadius: 16,
    backgroundColor: "#fafdff",
    padding: 14
  },
  featureMark: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: brandTheme.blue,
    marginBottom: 10
  },
  featureTitle: {
    color: brandTheme.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  featureBody: {
    color: brandTheme.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 5
  },
  runtimePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: brandTheme.border,
    borderRadius: 999,
    backgroundColor: brandTheme.subtleBlue,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  runtimeLabel: {
    color: brandTheme.blueDeep,
    fontSize: 12,
    fontWeight: "900"
  },
  runtimeValue: {
    color: brandTheme.navy,
    fontSize: 12,
    fontWeight: "800"
  }
});
