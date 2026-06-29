import { appConfig } from "../config";
import { ApiDiagnostic, NodeItem, UsageSummary } from "../types";

type ApiEnvelope<T> =
  | T
  | {
      code?: number;
      data?: T;
      message?: string;
      msg?: string;
      [key: string]: unknown;
    };

type RequestOptions = RequestInit & {
  token?: string;
};

type RawRecord = Record<string, unknown>;

type SubscriptionCredential = {
  subscribeUrl: string;
  token: string;
  raw: unknown;
};

export type LoginResult = {
  token: string;
  user: {
    email: string;
    planName: string;
  };
};

export class PpnodeApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly path?: string
  ) {
    super(message);
    this.name = "PpnodeApiError";
  }
}

const loginPaths = ["/v1/auth/login", "/v1/auth/login/telephone"];

const userInfoPaths = ["/v1/public/user/info"];

const userSubscribePaths = ["/v1/public/user/subscribe"];

const diagnosticPaths: Array<{ label: string; path: string }> = [
  { label: "site config", path: "/v1/common/site/config" },
  { label: "site subscribe", path: "/v1/common/site/subscribe" },
  { label: "user info", path: "/v1/public/user/info" },
  { label: "user notify", path: "/v1/public/user/notify" },
  { label: "user subscribe", path: "/v1/public/user/subscribe" },
  { label: "subscribe app config", path: "/v1/public/subscribe/application/config" },
  { label: "subscribe group", path: "/v1/public/subscribe/group/list" },
  { label: "subscribe list", path: "/v1/public/subscribe/list" },
  { label: "order list", path: "/v1/public/order/list" },
  { label: "ticket list", path: "/v1/public/ticket/list" },
  { label: "affiliate count", path: "/v1/public/user/affiliate/count" }
];

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.token
          ? {
              Authorization: options.token,
              AccessToken: options.token,
              Token: options.token
            }
          : {}),
        ...options.headers
      }
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      throw new PpnodeApiError(getPayloadMessage(payload) ?? `Request failed: ${response.status}`, response.status, path);
    }

    assertBusinessSuccess(payload, path);
    return payload as ApiEnvelope<T>;
  } catch (error) {
    if (error instanceof PpnodeApiError) {
      throw error;
    }

    throw new PpnodeApiError(error instanceof Error ? error.message : "Request failed", undefined, path);
  } finally {
    clearTimeout(timer);
  }
}

async function requestText(url: string, token?: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain, application/json",
        ...(token
          ? {
              Authorization: token,
              AccessToken: token,
              Token: token
            }
          : {})
      }
    });

    const text = await response.text();

    if (!response.ok) {
      throw new PpnodeApiError(text || `Subscription request failed: ${response.status}`, response.status, url);
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function tryPaths<T>(
  paths: string[],
  requestForPath: (path: string) => Promise<ApiEnvelope<T>>,
  label: string
): Promise<ApiEnvelope<T>> {
  const errors: string[] = [];

  for (const path of paths) {
    try {
      return await requestForPath(path);
    } catch (error) {
      if (!(error instanceof PpnodeApiError)) {
        throw error;
      }

      errors.push(`${path}: ${error.status ?? "business"} ${error.message}`);

      if (error.status && ![404, 405].includes(error.status)) {
        throw error;
      }
    }
  }

  throw new PpnodeApiError(`No available ${label} endpoint. ${errors.join("; ")}`);
}

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function assertBusinessSuccess(payload: unknown, path: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return;
  }

  const code = asNumber((payload as RawRecord).code, 0);

  if (code > 0 && code !== 200) {
    throw new PpnodeApiError(getPayloadMessage(payload) ?? `Business error: ${code}`, undefined, path);
  }
}

function getPayloadMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return typeof payload === "string" ? payload : undefined;
  }

  const record = payload as RawRecord;
  return asString(record.message) ?? asString(record.msg);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function extractToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as RawRecord;
  const direct =
    asString(record.token) ??
    asString(record.accessToken) ??
    asString(record.access_token) ??
    asString(record.auth_data) ??
    asString(record.authorization);

  if (direct) {
    return direct;
  }

  return extractToken(record.user) ?? extractToken(record.account);
}

function normalizeLogin(payload: ApiEnvelope<unknown>, email: string): LoginResult {
  const data = unwrapData(payload);
  const token = extractToken(data);

  if (!token) {
    throw new PpnodeApiError("Login succeeded but no token was found in the response.");
  }

  const record = typeof data === "object" && data ? (data as RawRecord) : {};
  const user = typeof record.user === "object" && record.user ? (record.user as RawRecord) : record;

  return {
    token,
    user: {
      email: asString(user.email) ?? email,
      planName: asString(user.plan_name) ?? asString(user.planName) ?? "PPPanel"
    }
  };
}

function firstRecordWithAnyKey(value: unknown, keys: string[]): RawRecord {
  if (!value || typeof value !== "object") {
    return {};
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = firstRecordWithAnyKey(item, keys);
      if (Object.keys(match).length > 0) {
        return match;
      }
    }

    return {};
  }

  const record = value as RawRecord;

  if (keys.some((key) => key in record)) {
    return record;
  }

  for (const nested of Object.values(record)) {
    const match = firstRecordWithAnyKey(nested, keys);
    if (Object.keys(match).length > 0) {
      return match;
    }
  }

  return record;
}

function normalizeUsage(payload: unknown): UsageSummary {
  const data = unwrapData(payload as ApiEnvelope<unknown>);
  const record = firstRecordWithAnyKey(data, [
    "u",
    "d",
    "upload",
    "download",
    "transfer_enable",
    "transferEnable",
    "used_traffic",
    "usedTraffic",
    "traffic",
    "expired_at",
    "expire_time"
  ]);
  const u = asNumber(record.u, asNumber(record.upload, 0));
  const d = asNumber(record.d, asNumber(record.download, 0));
  const usedTraffic = asNumber(record.used_traffic, asNumber(record.usedTraffic, 0));
  const transferEnable = asNumber(record.transfer_enable, asNumber(record.transferEnable, asNumber(record.traffic, 0)));

  return {
    todayDownloadBytes: asNumber(record.today_download, asNumber(record.todayDownloadBytes, 0)),
    todayUploadBytes: asNumber(record.today_upload, asNumber(record.todayUploadBytes, 0)),
    monthUsedBytes: asNumber(record.monthUsedBytes, usedTraffic || u + d),
    monthLimitBytes: transferEnable,
    remainingDays: asNumber(
      record.remainingDays,
      asNumber(record.expired_days, daysUntil(asNumber(record.expired_at, asNumber(record.expire_time, 0))))
    )
  };
}

function daysUntil(timestamp: number): number {
  if (!timestamp) {
    return 0;
  }

  const milliseconds = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return Math.max(0, Math.ceil((milliseconds - Date.now()) / 86_400_000));
}

function normalizeSubscriptionCredential(payloads: unknown[]): SubscriptionCredential {
  let subscribeUrl = "";
  let token = "";
  let raw: unknown = payloads;

  for (const payload of payloads) {
    const data = unwrapData(payload as ApiEnvelope<unknown>);
    const record = firstRecordWithAnyKey(data, [
      "subscribe_url",
      "subscribeUrl",
      "url",
      "token",
      "subscribe_token",
      "subscribeToken"
    ]);

    subscribeUrl =
      subscribeUrl ||
      asString(record.subscribe_url) ||
      asString(record.subscribeUrl) ||
      asString(record.url) ||
      findUrl(data) ||
      "";
    token =
      token ||
      asString(record.subscribe_token) ||
      asString(record.subscribeToken) ||
      asString(record.token) ||
      findTokenLikeString(data) ||
      "";
    raw = data;
  }

  return { subscribeUrl, token, raw };
}

function findUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.startsWith("http://") || value.startsWith("https://") ? value : undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  for (const nested of Object.values(value as RawRecord)) {
    const match = findUrl(nested);
    if (match) return match;
  }

  return undefined;
}

function findTokenLikeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.length >= 16 && !value.includes(" ") && !value.startsWith("http") ? value : undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  for (const nested of Object.values(value as RawRecord)) {
    const match = findTokenLikeString(nested);
    if (match) return match;
  }

  return undefined;
}

function buildSubscriptionUrlCandidates(credential: SubscriptionCredential): string[] {
  const urls = new Set<string>();

  if (credential.subscribeUrl) {
    urls.add(credential.subscribeUrl);
  }

  if (credential.token) {
    const encoded = encodeURIComponent(credential.token);
    const paths = [
      `/api/v1/client/subscribe?token=${encoded}`,
      `/api/client/subscribe?token=${encoded}`,
      `/client/subscribe?token=${encoded}`,
      `/v1/client/subscribe?token=${encoded}`,
      `/v1/public/client/subscribe?token=${encoded}`,
      `/api/v1/subscribe?token=${encoded}`,
      `/api/v1/public/subscribe?token=${encoded}`,
      `/v1/public/subscribe?token=${encoded}`,
      `/subscribe?token=${encoded}`,
      `/sub?token=${encoded}`,
      `/subscribe/${encoded}`,
      `/sub/${encoded}`
    ];

    [appConfig.apiBaseUrl, appConfig.userPortalUrl].forEach((baseUrl) => {
      paths.forEach((path) => urls.add(`${baseUrl}${path}`));
    });
  }

  return [...urls];
}

async function fetchSubscriptionText(credential: SubscriptionCredential, token: string): Promise<string> {
  const errors: string[] = [];

  for (const url of buildSubscriptionUrlCandidates(credential)) {
    try {
      const text = await requestText(url, token);
      if (parseSubscriptionNodes(text).length > 0) {
        return text;
      }
      errors.push(`${url}: no supported nodes`);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new PpnodeApiError(`Subscription content was not found. ${errors.join("; ")}`);
}

function parseSubscriptionNodes(content: string): NodeItem[] {
  const decoded = maybeDecodeBase64(content.trim());
  const lines = decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .flatMap((line) => extractNodeUris(line))
    .map((line, index) => parseNodeUri(line, index))
    .filter((node): node is NodeItem => Boolean(node));
}

function parseNodeUri(uri: string, index: number): NodeItem | null {
  if (uri.startsWith("vmess://")) {
    return parseVmess(uri, index);
  }

  if (
    uri.startsWith("vless://") ||
    uri.startsWith("trojan://") ||
    uri.startsWith("ss://") ||
    uri.startsWith("hysteria2://") ||
    uri.startsWith("hy2://")
  ) {
    return parseUrlNode(uri, index);
  }

  return null;
}

function extractNodeUris(line: string): string[] {
  const matches = line.match(/(?:vmess|vless|trojan|ss|hysteria2|hy2):\/\/[^\s"',]+/g);
  return matches ?? [line];
}

function parseVmess(uri: string, index: number): NodeItem | null {
  try {
    const json = maybeDecodeBase64(uri.slice("vmess://".length));
    const record = JSON.parse(json) as RawRecord;
    const name = asString(record.ps) ?? asString(record.name) ?? `VMess ${index + 1}`;
    const city = asString(record.add) ?? name;

    return {
      id: `vmess-${index}-${city}`,
      name,
      protocol: "VMESS",
      regionId: inferRegionId(`${name} ${city}`),
      city,
      latencyMs: 120 + index * 31,
      load: 0,
      online: true
    };
  } catch {
    return null;
  }
}

function parseUrlNode(uri: string, index: number): NodeItem | null {
  try {
    const parsed = new URL(uri);
    const name = decodeURIComponent(parsed.hash.replace(/^#/, "")) || `${parsed.protocol.replace(":", "").toUpperCase()} ${index + 1}`;
    const city = parsed.hostname || name;

    return {
      id: `${parsed.protocol}-${index}-${city}`,
      name,
      protocol: parsed.protocol.replace(":", "").toUpperCase(),
      regionId: inferRegionId(`${name} ${city}`),
      city,
      latencyMs: 120 + index * 31,
      load: 0,
      online: true
    };
  } catch {
    return null;
  }
}

function maybeDecodeBase64(value: string): string {
  const normalized = value.replace(/\s+/g, "");

  if (!normalized || /^(vmess|vless|trojan|ss|hysteria2|hy2):\/\//.test(value)) {
    return value;
  }

  try {
    const decoded = decodeBase64(normalized);
    return decoded.includes("://") || decoded.includes("\n") || decoded.trim().startsWith("{") ? decoded : value;
  } catch {
    return value;
  }
}

function decodeBase64(input: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const clean = input.replace(/-/g, "+").replace(/_/g, "/");
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    if (char === "=") break;
    const value = chars.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  try {
    return decodeURIComponent(
      output
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return output;
  }
}

function inferRegionId(text: string): string {
  const value = text.toLowerCase();

  if (value.includes("hong") || value.includes("香港") || value.includes("hk")) return "hk";
  if (value.includes("germany") || value.includes("德国") || value.includes("frankfurt") || value.includes("de ")) return "de";
  if (value.includes("japan") || value.includes("日本") || value.includes("tokyo") || value.includes("jp")) return "jp";
  if (value.includes("singapore") || value.includes("新加坡") || value.includes("sg")) return "sg";
  if (value.includes("taiwan") || value.includes("台湾") || value.includes("tw")) return "tw";
  if (value.includes("korea") || value.includes("韩国") || value.includes("kr")) return "kr";
  if (value.includes("united states") || value.includes("usa") || value.includes("美国") || value.includes("us")) return "us";

  return "hk";
}

function normalizeNodesFromPayload(payload: unknown): NodeItem[] {
  const data = unwrapData(payload as ApiEnvelope<unknown>);
  const records = collectNodeRecords(data);

  return records.map((record, index) => {
    const name =
      asString(record.name) ??
      asString(record.title) ??
      asString(record.remarks) ??
      asString(record.remark) ??
      `Node ${index + 1}`;
    const city =
      asString(record.city) ??
      asString(record.country) ??
      asString(record.region) ??
      asString(record.host) ??
      asString(record.server) ??
      asString(record.address) ??
      name;
    const protocol =
      asString(record.protocol) ??
      asString(record.type) ??
      asString(record.network) ??
      "PROXY";

    return {
      id: asString(record.id) ?? `${protocol}-${index}-${city}`,
      name,
      protocol: protocol.toUpperCase(),
      regionId: inferRegionId(`${name} ${city}`),
      city,
      latencyMs: 120 + index * 31,
      load: asNumber(record.load, 0),
      online: record.online === false || record.status === false ? false : true
    };
  });
}

function collectNodeRecords(value: unknown): RawRecord[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectNodeRecords(item));
  }

  const record = value as RawRecord;
  const hasNodeShape =
    Boolean(asString(record.host) ?? asString(record.server) ?? asString(record.address)) &&
    Boolean(asString(record.name) ?? asString(record.title) ?? asString(record.remarks) ?? asString(record.remark)) &&
    Boolean(asString(record.protocol) ?? asString(record.type) ?? asString(record.network) ?? asString(record.port));

  if (hasNodeShape) {
    return [record];
  }

  return Object.values(record).flatMap((nested) => collectNodeRecords(nested));
}

function describeDiagnosticPayload(payload: unknown): string {
  const data = unwrapData(payload as ApiEnvelope<unknown>);

  if (Array.isArray(data)) {
    return `array ${data.length}`;
  }

  if (data && typeof data === "object") {
    const record = data as RawRecord;
    const list = record.list;

    if (Array.isArray(list)) {
      const first = list[0];
      if (first && typeof first === "object" && !Array.isArray(first)) {
        return `list ${list.length}; item fields: ${Object.keys(first as RawRecord).slice(0, 10).join(", ")}`;
      }

      return `list ${list.length}`;
    }

    return `fields: ${Object.keys(record).slice(0, 8).join(", ") || "none"}`;
  }

  return typeof data === "string" ? data.slice(0, 80) : "empty";
}

function getBusinessCode(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const code = (payload as RawRecord).code;
  return typeof code === "number" ? code : undefined;
}

function previewPayload(payload: unknown): string {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  return text.length > 220 ? `${text.slice(0, 220)}...` : text;
}

async function probeJsonEndpoint(label: string, path: string, token: string): Promise<ApiDiagnostic> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
        AccessToken: token,
        Token: token
      }
    });
    const text = await response.text();
    let payload: unknown = text;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    const code = getBusinessCode(payload);
    const ok = response.ok && (code === undefined || code === 0 || code === 200);

    return {
      label,
      path,
      ok,
      status: response.status,
      code,
      message: ok ? describeDiagnosticPayload(payload) : getPayloadMessage(payload) ?? response.statusText,
      bodyPreview: previewPayload(payload)
    };
  } catch (error) {
    return {
      label,
      path,
      ok: false,
      message: error instanceof Error ? error.message : "request failed"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeSubscriptionUrl(url: string, token: string): Promise<ApiDiagnostic> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain, application/json",
        Authorization: token,
        AccessToken: token,
        Token: token
      }
    });
    const text = await response.text();
    const nodes = parseSubscriptionNodes(text);

    return {
      label: "subscription source",
      path: url.replace(appConfig.apiBaseUrl, ""),
      ok: response.ok && nodes.length > 0,
      status: response.status,
      message: response.ok ? `nodes ${nodes.length}` : response.statusText,
      bodyPreview: text.slice(0, 220)
    };
  } catch (error) {
    return {
      label: "subscription source",
      path: url.replace(appConfig.apiBaseUrl, ""),
      ok: false,
      message: error instanceof Error ? error.message : "request failed"
    };
  } finally {
    clearTimeout(timer);
  }
}

export const ppnodeApi = {
  async login(email: string, password: string) {
    const payload = await tryPaths(
      loginPaths,
      (path) =>
        requestJson<unknown>(path, {
          method: "POST",
          body: JSON.stringify({ email, password })
        }),
      "login"
    );

    return normalizeLogin(payload, email);
  },

  async fetchUserInfo(token: string) {
    const payload = await tryPaths(userInfoPaths, (path) => requestJson<unknown>(path, { token }), "user info");
    return unwrapData(payload);
  },

  async fetchUsage(token: string) {
    const payload = await tryPaths(
      [...userInfoPaths, "/v1/public/user/subscribe"],
      (path) => requestJson<unknown>(path, { token }),
      "usage"
    );
    return normalizeUsage(payload);
  },

  async fetchSubscription(token: string): Promise<SubscriptionCredential> {
    const payloads: unknown[] = [];
    const errors: string[] = [];

    for (const path of userSubscribePaths) {
      try {
        payloads.push(await requestJson<unknown>(path, { token }));
      } catch (error) {
        errors.push(`${path}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }

    if (payloads.length === 0) {
      throw new PpnodeApiError(`No subscription endpoint succeeded. ${errors.join("; ")}`);
    }

    return normalizeSubscriptionCredential(payloads);
  },

  async fetchNodes(token: string) {
    const credential = await this.fetchSubscription(token);
    const directNodes = normalizeNodesFromPayload(credential.raw);

    if (directNodes.length > 0) {
      return directNodes;
    }

    const subscriptionText = await fetchSubscriptionText(credential, token);
    const nodes = parseSubscriptionNodes(subscriptionText);

    if (nodes.length === 0) {
      throw new PpnodeApiError("Subscription content did not contain supported proxy nodes.");
    }

    return nodes;
  },

  async diagnoseAuthenticatedEndpoints(token: string): Promise<ApiDiagnostic[]> {
    return Promise.all(
      diagnosticPaths.map(({ label, path }) => probeJsonEndpoint(label, path, token))
    );
  },

  async diagnoseSubscriptionSources(token: string): Promise<ApiDiagnostic[]> {
    const credential = await this.fetchSubscription(token);
    const directNodes = normalizeNodesFromPayload(credential.raw);
    const directDiagnostic: ApiDiagnostic = {
      label: "user subscribe json",
      path: "/v1/public/user/subscribe",
      ok: directNodes.length > 0,
      status: 200,
      code: 200,
      message: `json nodes ${directNodes.length}`
    };

    return [
      directDiagnostic,
      ...(await Promise.all(buildSubscriptionUrlCandidates(credential).map((url) => probeSubscriptionUrl(url, token))))
    ];
  }
};
