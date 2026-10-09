# waylan.cc

余程漢的個人履歷與作品網站。首頁依目前角色、成長脈絡、代表作品與研究、工作經歷、早期作品、學歷與交流入口排列。

## 技術架構

- Astro 7 + TypeScript，自訂響應式 CSS。
- 日系繪本風、Google Fonts Huninn、原生 SVG 插圖與手機優先版面。
- CSS / Anime.js 4：卡片依序進場、捲動連動、SVG 視差、黏附導覽、作品整頁吸附與垂直帶動橫向展覽；提供動畫暫停控制，尊重系統減少動態效果設定。
- 公開頁面在建置時生成靜態 HTML，由 Vercel CDN 提供。
- 後台與 API 使用 Vercel Functions（Node.js 24）。
- Neon PostgreSQL 儲存訪問紀錄；本機可選用 PGlite。
- GitHub OAuth + PKCE + 簽章 Cookie，管理者以不可變的 GitHub 數字 ID 驗證。

## 本機啟動

需要 Node.js 24。

```sh
npm ci
cp .env.example .env
```

在 `.env` 設定 `SITE_URL=http://127.0.0.1:4321`、`LOCAL_DEVELOPMENT=true`，填入各自獨立的 `SESSION_SECRET`、`IP_ENCRYPTION_KEY`、`CRON_SECRET`。每個值均使用 32 個隨機 bytes 的 hex 字串，不要重複使用。可執行下列命令產生一個值，再分別產生另外兩個：

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run dev
```

若開發伺服器使用其他 port，請同步調整 `SITE_URL` 後重啟。本機預設使用 4321。

`/admin/login/` 提供本機預覽入口，只允許 Astro 開發模式、明確的本機設定與 loopback 連線。部署後無法使用此入口。PGlite 資料儲存在 `.local/analytics`，不提交 Git，也不部署。

Astro 7 在 agent 環境可能自動啟用背景伺服器；可使用 `astro dev status`、`astro dev stop` 管理。一般本機終端維持正常開發流程。

## 驗證

```sh
npm run check
npm test
npm run build
# 先啟動與 .env SITE_URL 相同的本機伺服器
npm run test:smoke
```

Smoke checks 會在本機建立測試造訪紀錄，不會對正式站點執行。它們驗證公開路由、後台登入保護、來源限制、IP 紀錄、去重與資料清理，不包含實際 GitHub OAuth 授權及正式 Neon 連線。

## 內容維護

- `src/pages/index.astro`：首頁、自介、工作經歷、學歷與首頁順序。
- `src/data/projects.ts`：專案名稱、本人角色、期間、工作內容與成果。
- `src/pages/work/[slug].astro`：共用專案詳頁。
- `src/data/media.ts`：App 與研究圖的標題、尺寸和說明。
- `src/components/MediaGallery.astro`、`ResearchViewer.astro`：圖片展示與研究比較。
- `src/scripts/gallery.ts`：滑動相簿、研究切換與圖片放大。
- `src/styles/storybook.css`：前台繪本風主題與手機優先版面。
- `src/scripts/scroll-motion.ts`、`src/styles/scroll-motion.css`：捲動連動、視差、黏附與橫向展覽。
- `src/components/StoryIllustration.astro`：依內容題材繪製的 SVG 插圖。
- `src/data/departure.ts`：下一段旅程的名稱與帶時區的出發日期；未設定時顯示準備中。
- `src/styles/portfolio.css`：共用作品詳頁與圖片展示版面。
- `docs/NEW_LOOK.md`：視覺、互動與倒數維護說明。
- `docs/PORTFOLIO.md`：內容順序、來源及圖片處理紀錄。
- `src/components/Architecture.astro`：Be水水系統架構示意。
- `src/scripts/site.ts`：互動、導覽與訪問統計呼叫。
- `src/styles/global.css`：前台排版與響應式規格。
- `public/images/`：已篩選並壓縮的公開圖片。
- `assets/originals/`：保留的舊站影像原稿，不會複製到公開網站。

不要把原始履歷圖片、PDF 或其他未核可的聯絡資訊直接放進 `public/`；目前公開聯絡入口使用使用者提供的 `waylanyu@gmail.com` 與 GitHub。

## 部署

完整步驟見 [Vercel 部署指南](docs/VERCEL.md)，統計行為與限制見 [訪問統計說明](docs/ANALYTICS.md)。推送程式不代表已經完成 Neon 或 GitHub OAuth 設定。
