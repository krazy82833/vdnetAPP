# VDNet PPNode App

一个面向 Android 和 iOS 的 PPNode 前端客户端。当前工程使用 Expo + React Native 实现，已按 `vdnet/` 里的参考截图完成首页、节点切换、连接状态、流量统计、邀请和我的页面。

## 运行

```powershell
npm.cmd install
npm.cmd run start
```

然后用 Expo Go 扫码预览，或继续执行：

```powershell
npm.cmd run android
npm.cmd run ios
```

## PPNode 接入点

配置文件在 `src/config.ts`，当前已经接入你的 vdnet 域名：

```ts
export const appConfig = {
  apiBaseUrl: "https://api.vdnet.top",
  userPortalUrl: "https://user.vdnet.top",
  adminPortalUrl: "https://admin.vdnet.top"
};
```

APP 启动后会先显示 PPNode 登录页。登录成功后，前端会用 token 自动同步节点和流量统计。因为当前 `user.vdnet.top` 和 `admin.vdnet.top` 有 Cloudflare Challenge，代码没有依赖抓取网页包，而是在 `src/services/ppnodeApi.ts` 中兼容 PPNode/V2Board/XBoard 常见接口路径：

- `POST /api/v1/passport/auth/login`
- `GET /api/v1/user/server/fetch`
- `GET /api/v1/user/stat`
- `GET /api/v1/user/getSubscribe`

同时还会尝试 `/api/...`、`/user/...`、`/auth/login` 等常见变体。如果你的 PPNode 面板接口路径不同，只需要替换 `src/services/ppnodeApi.ts` 中的路径数组和返回值映射。

## 重要说明

这个仓库目前实现的是“前端 APP”。真正的一键 VPN 连接需要原生隧道层：

- Android: `VpnService`
- iOS: `NetworkExtension` / `NETunnelProviderManager`

后续可以把当前 UI 和 PPNode API 接入保留不变，再增加原生模块来处理订阅解析、配置下发和 VPN 隧道启动。
