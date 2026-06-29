# VDNet APP Architecture

This document turns the SlagCore / SlagPulse product direction into an
implementation architecture for the current VDNet PPNode app.

## Product Target

VDNet should become a unified Android and iOS VPN client with:

- SlagCore: a lightweight native tunnel core, planned as a Rust-first runtime.
- SlagPulse: a node map and node selection experience.
- Multi-panel support: PPANEL first, then V2Board, XBoard/X2Board, SSP.
- Optional phone registration and login where the panel supports SMS.
- Replaceable branding: app name, logo, colors, domains, customer support.
- Full account workflows: invitation, redeem code, tickets, support, OSS-hosted
  resources, orders, subscription, traffic, and profile.

## Current Repository Scope

The current repository is an Expo + React Native implementation. It can deliver
the app shell, account UI, node map UI, panel API integration, diagnostics, and
web/mobile preview.

Native VPN tunneling is not implemented by Expo alone. Production VPN support
requires a native layer:

- Android: `VpnService`
- iOS: `NetworkExtension` / `NETunnelProvider`
- Core: Rust library exported through FFI or a native module bridge

## Layered Architecture

```text
src/
  app shell
    App.tsx
    src/screens/*
    src/components/*

  experience layer
    src/components/MapCanvas.tsx      SlagPulse node map
    src/components/NodeSheet.tsx      node selector
    src/screens/InfoScreens.tsx       invite, stats, profile

  account and panel layer
    src/services/ppnodeApi.ts         current PPANEL adapter
    future: src/services/panels/*     V2Board, XBoard, SSP adapters

  core layer
    src/core/slagCore.ts              SlagCore bridge boundary
    future: native Android/iOS module Rust FFI bridge

  shared domain
    src/types.ts
    src/config.ts
    src/data/*
    src/utils/*
```

## SlagCore Boundary

`src/core/slagCore.ts` is the stable interface between UI and the tunnel engine.
Today it provides a simulation bridge for web/Expo preview. The native phase
should replace its internals, not the UI call sites.

Required production methods:

- `connect(node, mode)` starts the tunnel.
- `disconnect()` stops the tunnel.
- `testLatency(node)` checks node quality.
- `getDiagnostics()` reports runtime, protocol, memory, and bridge state.

Rust phase requirements:

- No JavaScript parsing in the hot connection path.
- Streaming config parser with bounded allocations.
- Native crash isolation and structured error codes.
- Binary size target: keep the full client package below 40 MB when practical.

## Panel Adapter Contract

Each panel adapter should expose the same app-facing operations:

- `login`
- `registerByEmail`
- `registerByPhone` where supported
- `sendSmsCode`
- `fetchUserInfo`
- `fetchUsage`
- `fetchSubscription`
- `fetchNodes`
- `fetchTickets`
- `fetchInviteStats`
- `redeemCode`

The current PPANEL work has confirmed these endpoints:

- `POST /v1/auth/login`
- `GET /v1/public/user/info`
- `GET /v1/public/user/subscribe`
- `GET /v1/common/site/config`
- `GET /v1/common/site/subscribe`
- `GET /v1/public/subscribe/list`
- `GET /v1/public/subscribe/group/list`
- `GET /v1/public/subscribe/application/config`
- `GET /v1/public/ticket/list`
- `GET /v1/public/user/affiliate/count`

## Delivery Phases

1. Expo app shell and PPANEL API integration.
2. SlagCore bridge interface and SlagPulse node map UX.
3. Phone login/register screens using panel capability detection.
4. Tickets, redeem code, invite, orders, and support modules.
5. Native Android/iOS workspaces with Rust core bridge.
6. Store-ready app packaging and white-label branding pipeline.

## Non-Negotiables

- Do not store passwords or subscription tokens in committed source.
- Keep panel-specific response mapping inside adapters.
- Keep VPN runtime details behind the SlagCore bridge.
- Keep UI branding controlled by config, not hard-coded customer forks.
- Validate with `npm.cmd run typecheck` before pushing.
