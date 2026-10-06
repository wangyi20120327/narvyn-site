# Narvyn 官网（静态站）

Narvyn 的落地页。**v4 起是单文件全内联**：只有 `index.html` + `assets/img/` + `_headers` + 两个 JSON，
样式/结构/脚本全部写在 `index.html` 里，零 CDN、无构建步骤、跟随系统深浅色。

- 面向人群：中国大陆的手机用户
- 部署目标：Cloudflare Pages（连的是 **private** 仓 `narvyn-site`）
- 公开域名：`https://narvyn-site.pages.dev`
- 站内下载按钮直链 `narvyn-releases` 的最新 Release `Narvyn.apk`，并给 `gh-proxy.com` 境内加速备用链

---

## ⚠️ 域名在国内被 DNS 污染（2026-10-06 实测）

`narvyn-site.pages.dev` 在本机/国内网络下会被解析到**随机假 IP**（连不上），
只有权威 DNS（阿里 223.5.5.5 / 腾讯 / DoH）才返回 Cloudflare 真 IP。

**判据**：`nslookup narvyn-site.pages.dev` 返回的 IP **不在 `172.66.x.x` 段**，
且**两次查询结果不同** —— 那就是污染。用真 IP 直连可拿到 HTTP 200，说明站点本身是好的。

**影响面**：官网打不开；`update.json` / `announcements.json` 的 pages.dev 主源拉不到。

**对策**：App 侧两个 JSON 都改成「主源 + 镜像链」（见 `narvyn/lib/version.dart`、
`narvyn/lib/announcements.dart`）。镜像走 `gh.zwy.one` / `gh-proxy.com` 反代 GitHub raw。

> 🔴 **镜像只能服务 public 仓。** `narvyn-site` 是 private，走镜像一律 404。
> 所以 `update.json` 与 `announcements.json` 在 **`narvyn-releases`（public）根目录各有一份副本**，
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
2. 选择 GitHub **private** 仓库 **narvyn-site**（本目录内容推送在该仓库根目录）
3. 构建配置：
   - 框架预设：**None**
   - 构建命令：**留空**
   - 输出目录：**/**
4. 项目名就叫 **narvyn-site**，默认域名即 `https://narvyn-site.pages.dev`
5. 部署完成后可选：*Custom domains* 绑定自己的域名（**这是绕开 DNS 污染最彻底的办法**）

`_headers` 已按 Cloudflare Pages 格式写好：`/assets/*` 长缓存 immutable，
`index.html` / `update.json` / `announcements.json` 不缓存。

---

## 发新版流程

1. 改 `narvyn/lib/version.dart`（App 内版本号，必须与 `pubspec.yaml` 一致）
2. 改本目录 `update.json` 的 `versionName` / `versionCode` / `notes`（`sha1` 留空则跳过校验）
3. **把同一份 `update.json` 复制到 `narvyn-releases` 仓根目录** ← 漏了这步，国内「检查更新」必失败
4. 到 **narvyn-releases** 仓库发 Release 并上传新 APK —— **资产名必须叫 `Narvyn.apk`**（直链按文件名指向 latest）
5. 推送 `narvyn-site`（Cloudflare Pages 自动部署）

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
├── _headers            # Cloudflare Pages 缓存头
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
