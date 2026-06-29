import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { BottomTabs } from "./src/components/BottomTabs";
import { IconBubble } from "./src/components/IconBubble";
import { MapCanvas } from "./src/components/MapCanvas";
import { NodeSheet } from "./src/components/NodeSheet";
import { appConfig } from "./src/config";
import { nodes as fallbackNodes, regions, usageSummary } from "./src/data/nodes";
import { InviteScreen, ProfileScreen, StatsScreen } from "./src/screens/InfoScreens";
import { LoginResult, ppnodeApi } from "./src/services/ppnodeApi";
import { ApiDiagnostic, ConnectionState, NodeItem, ProxyMode, TabKey, UsageSummary } from "./src/types";
import { formatBytes, formatDuration } from "./src/utils/format";

const proxyModeLabel: Record<ProxyMode, string> = {
  global: "全局代理",
  rule: "规则代理",
  direct: "直连模式"
};

export default function App() {
  const [auth, setAuth] = useState<LoginResult | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>("home");
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [remoteNodes, setRemoteNodes] = useState<NodeItem[]>([]);
  const [usage, setUsage] = useState<UsageSummary>(usageSummary);
  const [selectedNode, setSelectedNode] = useState<NodeItem>(fallbackNodes[0]);
  const [proxyMode, setProxyMode] = useState<ProxyMode>("global");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>("hk");
  const [connectedSeconds, setConnectedSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<ApiDiagnostic[]>([]);
  const [subscriptionDiagnostics, setSubscriptionDiagnostics] = useState<ApiDiagnostic[]>([]);
  const [subscriptionUrl, setSubscriptionUrl] = useState("");

  const activeNodes = remoteNodes.length > 0 ? remoteNodes : fallbackNodes;

  useEffect(() => {
    if (!auth) {
      return;
    }

    void syncRemoteData(auth.token);
  }, [auth]);

  useEffect(() => {
    if (connectionState !== "connected") {
      return;
    }

    const timer = setInterval(() => {
      setConnectedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionState]);

  const visibleRegions = useMemo(() => {
    const activeRegionIds = new Set(activeNodes.map((node) => node.regionId));
    const filtered = regions.filter((region) => activeRegionIds.has(region.id));
    return filtered.length > 0 ? filtered : regions;
  }, [activeNodes]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedNode.regionId) ?? regions[0],
    [selectedNode.regionId]
  );

  const connected = connectionState === "connected";

  async function syncRemoteData(token: string) {
    setIsSyncing(true);
    setApiError(null);

    const [nodesResult, usageResult, subscriptionResult] = await Promise.allSettled([
      ppnodeApi.fetchNodes(token),
      ppnodeApi.fetchUsage(token),
      ppnodeApi.fetchSubscription(token)
    ]);

    if (nodesResult.status === "fulfilled" && nodesResult.value.length > 0) {
      setRemoteNodes(nodesResult.value);
      setSelectedNode(nodesResult.value[0]);
      setExpandedRegionId(nodesResult.value[0].regionId);
    }

    if (usageResult.status === "fulfilled") {
      setUsage(usageResult.value);
    }

    if (subscriptionResult.status === "fulfilled") {
      setSubscriptionUrl(subscriptionResult.value.subscribeUrl || subscriptionResult.value.token);
    }

    const errors = [nodesResult, usageResult, subscriptionResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

    setApiError(errors.length > 0 ? errors.join("；") : null);
    const [diagnosticResult, subscriptionDiagnosticResult] = await Promise.allSettled([
      ppnodeApi.diagnoseAuthenticatedEndpoints(token),
      ppnodeApi.diagnoseSubscriptionSources(token)
    ]);

    if (diagnosticResult.status === "fulfilled") {
      setDiagnostics(diagnosticResult.value);
    }

    if (subscriptionDiagnosticResult.status === "fulfilled") {
      setSubscriptionDiagnostics(subscriptionDiagnosticResult.value);
    }

    setIsSyncing(false);
  }

  function handleConnectionToggle() {
    if (connectionState === "connected") {
      setConnectionState("disconnected");
      setConnectedSeconds(0);
      return;
    }

    setConnectionState("connecting");
    setTimeout(() => {
      setConnectionState("connected");
      setConnectedSeconds(0);
    }, 650);
  }

  function handleLatencyTest() {
    setSelectedNode((current) => ({
      ...current,
      latencyMs: Math.max(48, current.latencyMs - 12)
    }));
  }

  if (!auth) {
    return <LoginScreen onLogin={setAuth} />;
  }

  const currentAuth = auth;

  function renderContent() {
    if (currentTab === "invite") {
      return <InviteScreen />;
    }

    if (currentTab === "stats") {
      return <StatsScreen usage={usage} />;
    }

    if (currentTab === "profile") {
      return <ProfileScreen auth={currentAuth} />;
    }

    return (
      <View style={styles.home}>
        <MapCanvas state={connectionState} selectedNode={selectedNode} regions={visibleRegions} />
        <ScrollView style={styles.panelWrap} contentContainerStyle={styles.panelContent} bounces={false}>
          <View style={styles.grabber} />
          {(apiError || diagnostics.length > 0) && (
            <View style={styles.apiNotice}>
              <Text style={styles.apiNoticeTitle}>API 接入提示</Text>
              {apiError && <Text style={styles.apiNoticeText}>{apiError}</Text>}
              {subscriptionUrl && (
                <Text style={styles.apiNoticeText}>
                  订阅凭据已获取：{subscriptionUrl.length > 36 ? `${subscriptionUrl.slice(0, 36)}...` : subscriptionUrl}
                </Text>
              )}
              {diagnostics
                .filter((item) => item.ok)
                .slice(0, 4)
                .map((item) => (
                  <Text key={item.path} style={styles.apiNoticeText}>
                    可用：{item.path}，{item.message}
                  </Text>
                ))}
              {diagnostics.some((item) => !item.ok) && (
                <Text style={styles.apiNoticeText}>
                  未命中接口 {diagnostics.filter((item) => !item.ok).length} 个，继续用服务器前端包可精确定位。
                </Text>
              )}
              {diagnostics.map((item) => (
                <Text key={`detail-${item.path}`} style={styles.apiNoticeText}>
                  {item.ok ? "OK" : "NO"} {item.path} HTTP {item.status ?? "-"} code {item.code ?? "-"}: {item.message}
                  {item.bodyPreview ? ` | ${item.bodyPreview}` : ""}
                </Text>
              ))}
              {subscriptionDiagnostics.map((item) => (
                <Text key={`sub-${item.path}`} style={styles.apiNoticeText}>
                  SUB {item.ok ? "OK" : "NO"} {item.path} HTTP {item.status ?? "-"}: {item.message}
                  {item.bodyPreview ? ` | ${item.bodyPreview}` : ""}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.connectionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEyebrow}>当前连接</Text>
              <Pressable style={styles.switchNodeButton} onPress={() => syncRemoteData(currentAuth.token)} disabled={isSyncing}>
                {isSyncing ? <ActivityIndicator color="#2394dc" /> : <Text style={styles.switchNodeText}>刷新节点 ↻</Text>}
              </Pressable>
            </View>

            <View style={styles.connectionMain}>
              <View style={styles.flagAvatar}>
                <Text style={styles.flag}>{selectedRegion.flag}</Text>
              </View>
              <View style={styles.connectionCopy}>
                <Text numberOfLines={1} style={styles.nodeTitle}>
                  {selectedNode.name}
                </Text>
                <View style={[styles.connectionBadge, connected && styles.connectedBadge]}>
                  <Text style={[styles.connectionBadgeText, connected && styles.connectedBadgeText]}>
                    ▮ {connected ? "已连接" : connectionState === "connecting" ? "连接中" : "未连接"}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: connected }}
                style={[styles.powerSwitch, connected && styles.powerSwitchOn]}
                onPress={handleConnectionToggle}
              >
                <View style={styles.powerKnob}>
                  <Text style={[styles.powerIcon, connected && styles.powerIconOn]}>⏻</Text>
                </View>
              </Pressable>
            </View>

            {connected && (
              <View style={styles.metricsGrid}>
                <MetricCard icon="▱" label="延迟" value={`${selectedNode.latencyMs} ms`} />
                <MetricCard icon="◷" label="已连接" value={formatDuration(connectedSeconds)} />
                <MetricCard icon="↓" label="下载" value={formatBytes(usage.todayDownloadBytes)} />
                <MetricCard icon="↑" label="上传" value={formatBytes(usage.todayUploadBytes)} />
              </View>
            )}
          </View>

          <View style={styles.quickActions}>
            <Pressable style={styles.actionTile} onPress={() => setSheetVisible(true)}>
              <IconBubble tone="gray" size={38}>
                ◉
              </IconBubble>
              <Text style={styles.actionText}>国家/地区</Text>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
            <Pressable
              style={styles.actionTile}
              onPress={() => setProxyMode(proxyMode === "global" ? "rule" : proxyMode === "rule" ? "direct" : "global")}
            >
              <Text style={styles.actionText}>{proxyModeLabel[proxyMode]}</Text>
              <Text style={styles.actionArrow}>⌄</Text>
            </Pressable>
          </View>
        </ScrollView>

        <NodeSheet
          visible={sheetVisible}
          regions={visibleRegions}
          nodes={activeNodes}
          expandedRegionId={expandedRegionId}
          selectedNodeId={selectedNode.id}
          onClose={() => setSheetVisible(false)}
          onLatencyTest={handleLatencyTest}
          onToggleRegion={(regionId) => setExpandedRegionId((current) => (current === regionId ? null : regionId))}
          onSelectNode={(node) => {
            setSelectedNode(node);
            setExpandedRegionId(node.regionId);
            setSheetVisible(false);
            setConnectionState("disconnected");
            setConnectedSeconds(0);
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <View style={styles.content}>{renderContent()}</View>
      <BottomTabs current={currentTab} onChange={setCurrentTab} />
    </SafeAreaView>
  );
}

function LoginScreen({ onLogin }: { onLogin: (auth: LoginResult) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await ppnodeApi.login(email.trim(), password);
      onLogin(result);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请检查 PPNode 接口。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginScreen}>
      <View style={styles.loginPanel}>
        <Text style={styles.loginBrand}>{appConfig.appName}</Text>
        <Text style={styles.loginTitle}>登录 PPNode 账户</Text>
        <Text style={styles.loginHint}>API: {appConfig.apiBaseUrl}</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="邮箱"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="密码"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.loginError}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || !email.trim() || !password}
          style={[styles.loginButton, (isSubmitting || !email.trim() || !password) && styles.loginButtonDisabled]}
          onPress={submit}
        >
          {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>登录并同步节点</Text>}
        </Pressable>

        <Text style={styles.portalText}>用户端: {appConfig.userPortalUrl}</Text>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <IconBubble size={48}>{icon}</IconBubble>
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  content: {
    flex: 1
  },
  loginScreen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#eef3fa",
    padding: 22
  },
  loginPanel: {
    borderRadius: 22,
    backgroundColor: "#ffffff",
    padding: 22,
    shadowColor: "#7c879b",
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5
  },
  loginBrand: {
    color: "#2f9cec",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  loginTitle: {
    color: "#20242c",
    fontSize: 28,
    fontWeight: "900"
  },
  loginHint: {
    color: "#68707d",
    fontSize: 13,
    marginBottom: 22,
    marginTop: 8
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#dce3ec",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    color: "#20242c",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16
  },
  loginError: {
    color: "#c0392b",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  loginButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#2f9cec"
  },
  loginButtonDisabled: {
    backgroundColor: "#9dcbed"
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900"
  },
  portalText: {
    color: "#7a8290",
    fontSize: 13,
    marginTop: 16
  },
  home: {
    flex: 1,
    position: "relative",
    backgroundColor: "#eef3fa"
  },
  panelWrap: {
    flex: 1,
    marginTop: -36,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#ffffff"
  },
  panelContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d8dadd",
    marginBottom: 22
  },
  apiNotice: {
    borderWidth: 1,
    borderColor: "#ffd9bd",
    borderRadius: 16,
    backgroundColor: "#fff7f0",
    marginBottom: 14,
    padding: 14
  },
  apiNoticeTitle: {
    color: "#8a4b12",
    fontSize: 15,
    fontWeight: "900"
  },
  apiNoticeText: {
    color: "#8a4b12",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  connectionCard: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 18,
    shadowColor: "#7c879b",
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  cardEyebrow: {
    color: "#555a64",
    fontSize: 17,
    fontWeight: "900"
  },
  switchNodeButton: {
    minWidth: 92,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c8e6f8",
    borderRadius: 999,
    backgroundColor: "#eef9ff",
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  switchNodeText: {
    color: "#2394dc",
    fontSize: 15,
    fontWeight: "900"
  },
  connectionMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  flagAvatar: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "#f3f5f8"
  },
  flag: {
    fontSize: 40
  },
  connectionCopy: {
    flex: 1,
    minWidth: 0
  },
  nodeTitle: {
    color: "#202329",
    fontSize: 28,
    fontWeight: "900"
  },
  connectionBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#f1f3f5",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  connectedBadge: {
    backgroundColor: "#e8f8ef"
  },
  connectionBadgeText: {
    color: "#6f7680",
    fontSize: 14,
    fontWeight: "800"
  },
  connectedBadgeText: {
    color: "#42a95c"
  },
  powerSwitch: {
    width: 82,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#e1e4ea",
    padding: 5
  },
  powerSwitchOn: {
    alignItems: "flex-end",
    backgroundColor: "#2f9cec"
  },
  powerKnob: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#ffffff"
  },
  powerIcon: {
    color: "#8b929d",
    fontSize: 22,
    fontWeight: "900"
  },
  powerIconOn: {
    color: "#2f9cec"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 22
  },
  metricCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#f0f2f5",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 14
  },
  metricLabel: {
    color: "#777d87",
    fontSize: 15,
    fontWeight: "800"
  },
  metricValue: {
    color: "#22262d",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 4
  },
  quickActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16
  },
  actionTile: {
    flex: 1,
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    shadowColor: "#7c879b",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  actionText: {
    flex: 1,
    color: "#202329",
    fontSize: 19,
    fontWeight: "900",
    marginLeft: 10
  },
  actionArrow: {
    color: "#737981",
    fontSize: 30,
    fontWeight: "800"
  }
});
