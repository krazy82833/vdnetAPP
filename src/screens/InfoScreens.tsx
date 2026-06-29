import { StyleSheet, Text, View } from "react-native";
import { IconBubble } from "../components/IconBubble";
import { usageSummary } from "../data/nodes";
import { LoginResult } from "../services/ppnodeApi";
import { UsageSummary } from "../types";
import { formatBytes } from "../utils/format";

export function InviteScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>邀请</Text>
      <View style={styles.panel}>
        <IconBubble tone="green">礼</IconBubble>
        <View style={styles.copy}>
          <Text style={styles.panelTitle}>邀请好友使用 VDNet</Text>
          <Text style={styles.panelText}>生成专属邀请码，好友注册后可按 PPNode 后台规则发放奖励。</Text>
        </View>
      </View>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>邀请码</Text>
        <Text style={styles.code}>VDNET-2026</Text>
      </View>
    </View>
  );
}

export function StatsScreen({ usage = usageSummary }: { usage?: UsageSummary }) {
  const percent =
    usage.monthLimitBytes > 0 ? Math.min(100, Math.round((usage.monthUsedBytes / usage.monthLimitBytes) * 100)) : 0;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>统计</Text>
      <View style={styles.panel}>
        <IconBubble>图</IconBubble>
        <View style={styles.copy}>
          <Text style={styles.panelTitle}>本月流量</Text>
          <Text style={styles.panelText}>
            已使用 {formatBytes(usage.monthUsedBytes)} / {formatBytes(usage.monthLimitBytes)}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${percent}%` }]} />
      </View>
      <View style={styles.metricGrid}>
        <Metric label="今日下载" value={formatBytes(usage.todayDownloadBytes)} />
        <Metric label="今日上传" value={formatBytes(usage.todayUploadBytes)} />
        <Metric label="剩余天数" value={usage.remainingDays > 0 ? `${usage.remainingDays} 天` : "未返回"} />
        <Metric label="套餐状态" value="可用" />
      </View>
    </View>
  );
}

export function ProfileScreen({ auth }: { auth: LoginResult | null }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>我的</Text>
      <View style={styles.panel}>
        <IconBubble tone="gray">我</IconBubble>
        <View style={styles.copy}>
          <Text style={styles.panelTitle}>{auth?.user.email ?? "未登录"}</Text>
          <Text style={styles.panelText}>{auth?.user.planName ?? "PPNode"} · API 已配置为 vdnet.top</Text>
        </View>
      </View>
      <View style={styles.list}>
        {["订阅链接", "设备管理", "工单支持", "应用设置"].map((item) => (
          <View key={item} style={styles.listRow}>
            <Text style={styles.listLabel}>{item}</Text>
            <Text style={styles.listArrow}>›</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fb",
    padding: 24
  },
  title: {
    color: "#20242c",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 24
  },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 18,
    shadowColor: "#8d98ad",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  copy: {
    flex: 1
  },
  panelTitle: {
    color: "#22262e",
    fontSize: 20,
    fontWeight: "900"
  },
  panelText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4
  },
  codeBox: {
    borderRadius: 18,
    backgroundColor: "#101820",
    marginTop: 18,
    padding: 20
  },
  codeLabel: {
    color: "#93a4b5",
    fontSize: 13,
    fontWeight: "700"
  },
  code: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8
  },
  progressTrack: {
    height: 12,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#e8edf4",
    marginVertical: 20
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2f9cec"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  metric: {
    width: "47%",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16
  },
  metricLabel: {
    color: "#7a808a",
    fontSize: 14,
    fontWeight: "700"
  },
  metricValue: {
    color: "#20242c",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8
  },
  list: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 18
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f4",
    paddingHorizontal: 18
  },
  listLabel: {
    color: "#252932",
    fontSize: 17,
    fontWeight: "800"
  },
  listArrow: {
    color: "#8a9099",
    fontSize: 30
  }
});
