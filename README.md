# Narvyn 官网（静态站）

Narvyn 的落地页 + 下载页。纯静态：`index.html` + `styles.css` + `app.js` + `sw.js` + `_headers` + `update.json` + `assets/`，无构建步骤、无任何外部 CDN（GSAP 已自托管在 `assets/js/`）。

- 面向人群：中国大陆的手机用户
- 部署目标：Cloudflare Pages
- 站内下载按钮直链 `narvyn-releases` 仓库的最新 Release `Narvyn.apk`，并提供 `gh-proxy.com` 境内加速备用链
- `update.json` 是 **App 内检查更新**用的接口文件，App 会拉取它判断新版本，改版本必须同步改它

## 本地预览

```bash
cd website
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> 开屏动画只在**首次访问**出现（localStorage `narvyn_seen_intro`）。想重看：DevTools → Application → Local Storage → 删除该键后刷新。

## 部署到 Cloudflare Pages

1. 登录 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择 GitHub 私有仓库 **narvyn-site**（本目录内容推送在该仓库根目录）
3. 构建配置：
   - 框架预设：**None**
   - 构建命令：**留空**
   - 输出目录：**/**
4. 项目名建议就叫 **narvyn-site**，默认域名即 `https://narvyn-site.pages.dev`
5. 部署完成后可选：*Custom domains* 绑定自己的域名

`_headers` 已按 Cloudflare Pages 格式写好：`/assets/*` 长缓存 immutable，`index.html` / `sw.js` / `update.json` 不缓存。

## 发新版流程

1. 改 `narvyn/lib/version.dart`（App 内版本号）
2. 改本目录 `update.json` 的 `versionName` / `versionCode` / `notes`（`sha1` 留空则跳过校验）
3. 到 **narvyn-releases** 仓库发 Release 并上传新 APK —— **资产名必须叫 `Narvyn.apk`**（直链按文件名指向 latest）
4. 网站无需改代码：下载按钮与 `update.json` 都指向 latest，推送后即生效

> 算新 APK 的 SHA1：`certutil -hashfile Narvyn.apk SHA1`（Windows），填进 `update.json` 的 `sha1`。

## 素材说明

- `assets/img/shot-home.webp`、`shot-detail.webp`、`shot-downloads.webp`、`shot-resource.webp`、`shot-emulator.webp`：真机界面截图，统一 720×1280（9:16），状态栏含在图内
- `assets/img/shot-settings.webp`：备用截图（「设置」页，当前页面未引用，留着换用）
- `assets/img/qr.png`：512×512 真实二维码，内容即直连 APK 链接；如图片缺失，页面会自动隐藏二维码区块，不影响其他内容
- `assets/js/gsap.min.js`、`ScrollTrigger.min.js`：GSAP 3.13.0 自托管，勿删

## 结构速览

```
website/
├── index.html        # 单页：开屏动画 → Hero → 截图长廊 → 特性 → 数字 → 下载
├── styles.css        # Apple「Liquid Glass」风格，全部系统字体
├── app.js            # 开屏动画 / 导航发丝线 / GSAP 滚动动效（全部有降级守卫）
├── sw.js             # Service Worker（assets 走 cache-first，update.json 永不缓存）
├── _headers          # Cloudflare Pages 缓存头
├── update.json       # App 检查更新接口
└── assets/
    ├── js/           # 自托管 GSAP
    └── img/          # 截图 / 二维码
```
