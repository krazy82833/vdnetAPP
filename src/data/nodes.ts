import { NodeItem, Region, UsageSummary } from "../types";

export const regions: Region[] = [
  {
    id: "de",
    name: "Germany",
    displayName: "德国",
    flag: "🇩🇪",
    coordinate: { left: 39, top: 47 }
  },
  {
    id: "hk",
    name: "Hong Kong",
    displayName: "香港",
    flag: "🇭🇰",
    coordinate: { left: 52, top: 55 }
  },
  {
    id: "jp",
    name: "Japan",
    displayName: "日本",
    flag: "🇯🇵",
    coordinate: { left: 66, top: 50 }
  },
  {
    id: "sg",
    name: "Singapore",
    displayName: "新加坡",
    flag: "🇸🇬",
    coordinate: { left: 54, top: 66 }
  },
  {
    id: "tw",
    name: "Taiwan",
    displayName: "台湾",
    flag: "🇹🇼",
    coordinate: { left: 61, top: 56 }
  },
  {
    id: "kr",
    name: "Korea",
    displayName: "韩国",
    flag: "🇰🇷",
    coordinate: { left: 64, top: 50 }
  },
  {
    id: "us",
    name: "United States",
    displayName: "美国",
    flag: "🇺🇸",
    coordinate: { left: 24, top: 48 }
  }
];

export const nodes: NodeItem[] = [
  {
    id: "hk-vmess-01",
    name: "vmess+https",
    protocol: "VMess",
    regionId: "hk",
    city: "Hong Kong",
    latencyMs: 377,
    load: 42,
    online: true
  },
  {
    id: "de-vless-01",
    name: "Germany Premium",
    protocol: "VLESS",
    regionId: "de",
    city: "Frankfurt",
    latencyMs: 188,
    load: 34,
    online: true
  },
  {
    id: "jp-trojan-01",
    name: "Japan Relay",
    protocol: "Trojan",
    regionId: "jp",
    city: "Tokyo",
    latencyMs: 96,
    load: 51,
    online: true
  },
  {
    id: "sg-vmess-01",
    name: "Singapore Edge",
    protocol: "VMess",
    regionId: "sg",
    city: "Singapore",
    latencyMs: 122,
    load: 28,
    online: true
  }
];

export const usageSummary: UsageSummary = {
  todayDownloadBytes: 0,
  todayUploadBytes: 0,
  monthUsedBytes: 18.6 * 1024 * 1024 * 1024,
  monthLimitBytes: 120 * 1024 * 1024 * 1024,
  remainingDays: 26
};
