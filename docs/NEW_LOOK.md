# 日系繪本風個人網站

網站以余程漢既有的履歷、研究與作品內容，重新整理成「工程師的繪本小旅程」。首頁依序為自介與 SVG 插圖、出發倒數、重點卡片與成長脈絡、可切換的精選作品、研究與發表、工作經歷、早期作品、學歷與聯絡入口。

## 視覺

- 和紙白 `#FFFCF6`、墨灰 `#3E3A39`，主要框線 3px。
- 珊瑚粉 `#F2A497`、山吹黃 `#F6D27A`、水色 `#A8D3E6`、若竹綠 `#B9DAA5`。
- 淺色背景、大圓角、平塗與實色位移陰影；不使用漸層。
- Google Fonts Huninn 由固定版本 `@fontsource/huninn` 隨網站提供，無需向 Google 發送字型請求；載入失敗時使用系統繁體中文字型。
- 插圖由 `src/components/StoryIllustration.astro` 以原生 SVG 繪製，題材包含工程師書桌、筆電、顯微鏡、手機、相機、書本、信封與行李箱。
- 前台共用主題為 `src/styles/storybook.css`；作品詳頁、作品索引與隱私頁也沿用此主題。後台仍使用原有樣式。

## 互動

- 頂端固定選單，手機版可展開；Escape 關閉並將焦點返回按鈕。
- 精選作品支援點擊、方向鍵、Home / End，具有 tab / tabpanel 語意。
- 插圖輕微漂浮與搖擺；作品、研究階段切換有輕微彈跳。
- 「暫停動畫」控制、系統減少動態效果偏好與分頁背景暫停。
- 不執行 JavaScript 時，作品仍全部顯示，研究圖與連結仍可閱讀。
- 既有圖片放大、研究階段切換、統計與公開內容篩選仍保留。

## 出發倒數

在 `src/data/departure.ts` 設定：

```ts
export const departure: { title: string; at: string | null } = {
  title: '下一站，準備中',
  at: null,
};
```

確認行程後，將 `title` 改成實際目的地或旅程名稱，並以帶明確時區的 ISO 8601 格式設定 `at`（`YYYY-MM-DDTHH:mm:ss+08:00`）。目前使用者尚未提供日期，因此保持 `null`，顯示準備中的狀態，避免捏造行程。

有效日期會顯示臺北時間及天／時／分／秒；到期後顯示「已經出發，旅程開始！」，不出現負數。背景分頁停止計時，返回時重新計算。秒數不使用 live region，避免螢幕閱讀器每秒播報。

## 本機驗證

```sh
npm run build
node --import tsx --test tests/*.test.ts
```

第二條與 `npm test` 使用相同測試，但避開受限環境中 tsx CLI 的 Unix IPC pipe。正式專案仍可正常使用 `npm test`。

## 預覽與驗證紀錄

- `npm run build`：48 個 Astro 檔案，0 errors / warnings / hints，Vercel 建置完成。
- `node --import tsx --test tests/*.test.ts`：10 項測試通過，涵蓋倒數、內容可見性與既有安全／資料庫檢查。
- Chromium：檢查首頁 320、375、390、600、768、960、1440px，並檢查作品索引、研究／App／作品詳頁與隱私頁的手機、桌面版；均無水平溢出。
- 檢查分頁鍵盤操作、手機選單與 Escape 焦點返回、研究圖片放大、動畫暫停、減少動態效果、未設定倒數與停用 JavaScript 時的內容可讀性。

桌面與手機預覽（首頁上半部）：

![桌面版](previews/storybook-desktop.webp)

![手機版](previews/storybook-mobile.webp)
