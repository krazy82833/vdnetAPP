export type ConnectionState = "disconnected" | "connecting" | "connected";

export type ProxyMode = "global" | "rule" | "direct";

export type TabKey = "home" | "invite" | "stats" | "profile";

export type Region = {
  id: string;
  name: string;
  displayName: string;
  flag: string;
  coordinate: {
    left: number;
    top: number;
  };
};

export type NodeItem = {
  id: string;
  name: string;
  protocol: string;
  regionId: string;
  city: string;
  latencyMs: number;
  load: number;
  online: boolean;
};

export type UsageSummary = {
  todayDownloadBytes: number;
  todayUploadBytes: number;
  monthUsedBytes: number;
  monthLimitBytes: number;
  remainingDays: number;
};

export type ApiDiagnostic = {
  label: string;
  path: string;
  ok: boolean;
  message: string;
  status?: number;
  code?: number;
  bodyPreview?: string;
};
