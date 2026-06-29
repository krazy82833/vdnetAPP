export type ProductCapability = {
  id: string;
  title: string;
  status: "available" | "planned" | "native-required";
  ownerLayer: "ui" | "panel-adapter" | "slag-core" | "native";
};

export const productCapabilities: ProductCapability[] = [
  {
    id: "slag-core",
    title: "SlagCore tunnel bridge",
    status: "planned",
    ownerLayer: "slag-core"
  },
  {
    id: "slag-pulse",
    title: "SlagPulse node map",
    status: "available",
    ownerLayer: "ui"
  },
  {
    id: "phone-register",
    title: "Optional phone registration",
    status: "planned",
    ownerLayer: "panel-adapter"
  },
  {
    id: "panel-ppanel",
    title: "PPANEL integration",
    status: "available",
    ownerLayer: "panel-adapter"
  },
  {
    id: "panel-v2board-xboard-ssp",
    title: "V2Board, XBoard/X2Board, SSP adapters",
    status: "planned",
    ownerLayer: "panel-adapter"
  },
  {
    id: "white-label-ui",
    title: "Unified replaceable branding",
    status: "available",
    ownerLayer: "ui"
  },
  {
    id: "native-vpn",
    title: "Android VpnService and iOS NetworkExtension",
    status: "native-required",
    ownerLayer: "native"
  }
];
