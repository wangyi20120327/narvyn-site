# Narvyn 官网（静态站）

Narvyn 的落地页。**v4 起是单文件全内联**：只有 `index.html` + `assets/img/` + `_headers` + 两个 JSON，
样式/结构/脚本全部写在 `index.html` 里，零 CDN、无构建步骤、跟随系统深浅色。

- 面向人群：中国大陆的手机用户
- 部署目标：Cloudflare Pages（连的是 `narvyn-site` 仓，**2026-10-07 起设为 public**）
- 公开域名：`https://narvyn.pages.dev`
  （★ 2026-10-10 用户在 Cloudflare 把 **Pages 项目名从 `narvyn-site` 改成 `narvyn`** ——
  GitHub 仓名**没变**，变的只是 Pages 子域。旧子域 `narvyn-site.pages.dev` 当场消失
  （权威 DNS = NXDOMAIN，不是污染），所以**凡是写死旧域名的东西都得跟着改**：
  `narvyn/lib/version.dart` 两个 URL、`narvyn/lib/announcements.dart` 的 `_siteHost`、
  本目录 `announcements.json` 的图片直链。**已装在用户手机上的旧版改不了代码**，
  它们的 pages.dev 主源从此必挂、只剩镜像链 ⇒ 下面那条"两处都要改"现在是硬要求。）
- **下载主链 2026-10-17 起是站内直链 `/Narvyn.apk`**：APK 本体提交在本仓根目录，
  Cloudflare Pages 直接分发 —— 单架构包 **18.7 MB < Pages 单文件 25 MiB 上限**
  （此前 38.5 MB 的三架构包超限，这也是它一直只能放 GitHub Release 的原因）。
  站内两个按钮：主 = `https://narvyn.pages.dev/Narvyn.apk`，备 = `gh-proxy.com`
  反代的本仓 Release 资产。**`update.json` 的 `url`/`urlBackup` 同口径**（App 检查更新
  下载走同一套；主链失败自动切备链是 App 端 `UpdateService.downloadApk` 的既有行为）。
  ★ 2026-10-17 实测换备链的依据：gh.zwy.one 3/3 全挂、gh-proxy.com 2/3 通、
  github.com 直连 0/3 —— 加速域是会挂的，**双链并存是硬要求，别退化成单链**。
  Release 继续保留：既是备链来源，也是历史版本的回滚点。
- **仍留在 `narvyn-releases` 的**：`runtime-assets` Release（rootfs / 内核，App 内写死直链）与
  公告图 `site-assets` —— 那个仓**不能删**，删了已装用户的公告与环境下载全断

---

## ⚠️ 域名在国内被 DNS 污染（2026-10-06 实测）

`narvyn.pages.dev`（改名前叫 `narvyn-site.pages.dev`）在本机/国内网络下**可能**被解析到
**随机假 IP**（连不上），只有权威 DNS（阿里 223.5.5.5 / 腾讯 / DoH）才返回 Cloudflare 真 IP。

> 2026-10-10 改名后本机复检：`nslookup narvyn.pages.dev` 走 1.1.1.1 与本机都正常，
> curl 实测落在 `172.66.44.193`（真 IP 段），首页 / 两个 JSON / 3 张公告图全部 200。
> **污染是按网络、按时间飘的，不是按域名的** —— 换名不等于免疫，镜像链不许撤。

**判据**：`nslookup narvyn.pages.dev` 返回的 IP **不在 `172.66.x.x` 段**，
且**两次查询结果不同** —— 那就是污染。用真 IP 直连可拿到 HTTP 200，说明站点本身是好的。

**影响面**：官网打不开；`update.json` / `announcements.json` 的 pages.dev 主源拉不到。

**对策**：App 侧两个 JSON 都改成「主源 + 镜像链」（见 `narvyn/lib/version.dart`、
`narvyn/lib/announcements.dart`）。镜像走 `gh.zwy.one` / `gh-proxy.com` 反代 GitHub raw。

> 🔴 **App 已发版本里写死的镜像 URL 仍指向 `narvyn-releases`**（`gh.zwy.one` / `gh-proxy.com` 反代 raw）。
> `narvyn-site` 公开后镜像理论上也能服务本仓 raw，但**旧版 App 改不了已写死的地址**，
> 所以 `update.json` 与 `announcements.json` 在 **`narvyn-releases` 根目录各有一份副本**照放，
> **发版时两处都要改**（见下方流程第 3 步）。
>
> 🔴 **镜像返回的 `Content-Type` 是 `text/plain`**，dio 只在响应类型是 JSON 时才自动解析。
> 解析侧必须显式 `ResponseType.plain` + 手动 `jsonDecode`，否则整条镜像链会**静默白跑**。

---

## 本地预览

```bash
cd website
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

---

## 部署到 Cloudflare Pages

1. 登录 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择 GitHub 仓库 **narvyn-site**（本目录内容推送在该仓库根目录；仓已 public，Pages 不受可见性影响）
3. 构建配置：
   - 框架预设：**None**
   - 构建命令：**留空**
   - 输出目录：**/**
4. 项目名 2026-10-10 起叫 **narvyn**（默认域名 `https://narvyn.pages.dev`；原来是
   `narvyn-site`，改名后旧域名立刻失效）。★ 在 Cloudflare 后台改项目名 = **换域名**，
   改完必须同步 App 侧 `lib/version.dart` + `lib/announcements.dart` 与本目录
   `announcements.json`，然后**重新出包**才生效
5. 部署完成后可选：*Custom domains* 绑定自己的域名（**这是绕开 DNS 污染最彻底的办法**）

`_headers` 已按 Cloudflare Pages 格式写好：`/assets/*` 长缓存 immutable，
`index.html` / `update.json` / `announcements.json` 不缓存。

---

## 发新版流程

> ★ **顺序铁律**：先把两样东西就位（步骤 3 的仓内 `Narvyn.apk`、步骤 4 的 Release 资产），
> **最后**才推 `update.json`（步骤 5-6）—— update.json 一上线，所有旧用户"检查更新"
> 就看到新版并开始下载，此时下载链必须已经可用，否则就是"提示有新版但下载 404"。

1. 改 `narvyn/lib/version.dart`（App 内版本号，必须与 `pubspec.yaml` 一致）
2. 改本目录 `update.json` 的 `versionName` / `versionCode` / `notes`，
   出包后 `certutil -hashfile Narvyn.apk SHA1` 现算 `sha1`、填 `apkSize`（字数对不上会拦下载）
3. **把新 APK 以 `Narvyn.apk` 为名提交进本仓根目录**（覆盖上一版）← 主下载链。
   本机 `github.com:443` 常年时通时断，走不了 git 就用 **Git Data API**（blobs → trees →
   commits → PATCH ref，blob 接口收 25 MB 级 base64 没问题，2026-10-17 实测）
4. 到**本仓发 Release** 并上传同一份 `Narvyn.apk` —— **资产名必须叫 `Narvyn.apk`**
   （备链按 `releases/latest/download/Narvyn.apk` 取）；新 Release 建好后确认它才是 latest
   （`gh release view --latest` 或看 Release 页标记）← 备链 + 历史留档。
   建议 draft 建 → 传资产 → publish（latest 切换瞬间资产已在位，零 404 窗口）
5. **把同一份 `update.json` 复制到 `narvyn-releases` 仓根目录** ← 漏了这步，旧版 App 的国内「检查更新」必失败
6. 推送 `narvyn-site`（Cloudflare Pages 自动部署，约 1 分钟；`_headers` 里
   `/Narvyn.apk` 是 `no-cache`，部署完用户立刻拿到新包）

> 算新 APK 的 SHA1：`certutil -hashfile Narvyn.apk SHA1`（Windows），填进 `update.json` 的 `sha1`。

> 如果 `github.com:443` 不通（本机常见），可用 GitHub Contents API 直接改文件：
> `gh api --method PUT repos/<owner>/<repo>/contents/<path> --input payload.json`
> （payload 含 `message` / base64 的 `content` / 已存在文件的远端 `sha` / `branch`）。

---

## 素材说明

- `assets/img/shot-home|detail|downloads|resource|emulator.webp`：真机界面截图，统一 720×1280（9:16），状态栏含在图内
- `assets/img/shot-settings.webp`：备用截图（当前页面已引用在截图墙最后一格）
- `assets/img/qr.png`：512×512 二维码（v4 页面未引用，留着备用）

---

## 结构速览

```
website/
├── index.html          # 单文件全内联：样式 + 结构 + 脚本，零外部依赖
├── _headers            # Cloudflare Pages 缓存头（/Narvyn.apk 也是 no-cache）
├── Narvyn.apk          # 最新安装包本体（主下载链；Release 同名资产是备链）
├── update.json         # App 检查更新接口（narvyn-releases 有同一份副本）
├── announcements.json  # 公告清单（narvyn-releases 有同一份副本）
└── assets/img/         # 截图 / 二维码
```

## index.html 里几个容易踩的点

- **`.device img` 必须显式写 `height: auto`**：否则 `<img height="1280">` 的 presentational hint
  会压过 `aspect-ratio`，手机壳按 1280px 高渲染（v4 上线后真视口实测踩到过）。
- **渐入动画的「隐藏」开关是 `html.js`**：`.rv` 默认可见，只有 JS 跑起来才隐藏再渐入。
  开关写在 `<head>`（首绘前生效，防 FOUC）；页尾脚本负责解锁，
  并带两层兜底 —— `window error` 立刻放开、IO 建好却不回调时 1.5s 后放开
  （`html.rv-fallback`）。**任何失败都退化成静态页，绝不白屏。**
