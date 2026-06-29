import { ConnectionState, NodeItem, ProxyMode } from "../types";

export type SlagCoreRuntime = {
  name: "SlagCore";
  bridge: "expo-simulation" | "native-rust";
  version: string;
  targetBundleSizeMb: number;
};

export type SlagCoreSession = {
  state: Extract<ConnectionState, "connected">;
  tunnelId: string;
  nodeId: string;
  mode: ProxyMode;
  connectedAt: number;
};

export type SlagCoreDiagnostics = {
  runtime: SlagCoreRuntime;
  nativeTunnelReady: boolean;
  supportedProtocols: string[];
};

export interface SlagCoreBridge {
  readonly runtime: SlagCoreRuntime;
  connect(node: NodeItem, mode: ProxyMode): Promise<SlagCoreSession>;
  disconnect(): Promise<void>;
  testLatency(node: NodeItem): Promise<number>;
  getDiagnostics(): SlagCoreDiagnostics;
}

function buildTunnelId(node: NodeItem, mode: ProxyMode) {
  return `slag-${mode}-${node.id}-${Date.now()}`;
}

export function createSlagCoreBridge(): SlagCoreBridge {
  const runtime: SlagCoreRuntime = {
    name: "SlagCore",
    bridge: "expo-simulation",
    version: "0.1.0",
    targetBundleSizeMb: 40
  };

  return {
    runtime,

    async connect(node, mode) {
      await wait(520);
      return {
        state: "connected",
        tunnelId: buildTunnelId(node, mode),
        nodeId: node.id,
        mode,
        connectedAt: Date.now()
      };
    },

    async disconnect() {
      await wait(120);
    },

    async testLatency(node) {
      await wait(180);
      return Math.max(42, node.latencyMs - 12);
    },

    getDiagnostics() {
      return {
        runtime,
        nativeTunnelReady: false,
        supportedProtocols: ["vmess", "vless", "trojan", "ss", "hy2"]
      };
    }
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const slagCore = createSlagCoreBridge();
