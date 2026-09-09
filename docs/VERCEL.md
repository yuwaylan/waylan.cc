# Vercel Hobby 部署指南

## 架構選擇

公開履歷與作品預先產生靜態 HTML，只有 `/admin/` 與 `/api/` 的動態路由使用 Functions。資料庫採 Neon 的 HTTP serverless driver，不使用 Vercel 本機檔案作為正式資料庫，也不需要長期運行的 server。

首頁、作品頁及 Archive 讀取不依賴資料庫；資料庫尚未設定時，公開頁面仍可瀏覽。

Hobby 適用於非商業個人用途。日後若網站成為商業營運用途，應重新確認方案適用性。Vercel 與 Neon 各有用量限制，這份架構不承諾任何流量下都免費。[Vercel Hobby 官方說明](https://vercel.com/docs/plans/hobby)

## 1. 匯入專案

在 Vercel 匯入 `yuwaylan/waylan.cc`，Framework 選 Astro，Root Directory 保持 repository 根目錄。使用 Node.js 24、`npm ci` 安裝、`npm run build` 建置。輸出設定使用 Astro adapter 的預設值，不手動覆寫 Output Directory。

主分支為 `master`。如果 Vercel 已連接此 repository，push 可能自動觸發既有部署設定。

## 2. 建立 Neon 資料庫

透過 Vercel Marketplace 的 Neon integration 或 Neon Console 建立 PostgreSQL database。資料庫與 Function region 盡量接近，將連線字串存入 Vercel Production 環境的 `DATABASE_URL`。

在 Neon SQL Editor 執行 repository 的 `db/schema.sql`；或者本機 `.env` 設定好正確資料庫 URL 後，執行：

```sh
npm run db:migrate
```

Schema 使用 `CREATE TABLE / INDEX IF NOT EXISTS`，可以重跑。不在每個正式請求裡自動修改 schema。

[Neon Vercel 整合](https://vercel.com/marketplace/neon/neon) · [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)

## 3. GitHub OAuth

在 GitHub 的 Settings → Developer settings → OAuth Apps 建立 OAuth App：

- Homepage URL：你的正式網站 origin，例如 `https://waylan.cc`。
- Authorization callback URL：`https://waylan.cc/api/auth/callback`。
- 將 Client ID 與 Client Secret 填入 Vercel 環境設定。
- `ADMIN_GITHUB_ID` 使用 `29536621`，對應 yuwaylan。驗證實際 GitHub user ID，不接受瀏覽器自行提供的 username。

只讀取登入者的公開帳號身分，不索取 repository 或 email scope。OAuth token 用於當次身分確認，不寫入資料庫或瀏覽器。

[GitHub OAuth 官方文件](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

## 4. Production 環境變數

| 名稱                       | 用途                                                    |
| -------------------------- | ------------------------------------------------------- |
| `SITE_URL`                 | 完整正式 origin，不含結尾斜線，例如 `https://waylan.cc` |
| `DATABASE_URL`             | Neon PostgreSQL 連線字串                                |
| `GITHUB_CLIENT_ID`         | OAuth App Client ID                                     |
| `GITHUB_CLIENT_SECRET`     | OAuth App Client Secret                                 |
| `ADMIN_GITHUB_ID`          | `29536621`                                              |
| `SESSION_SECRET`           | 獨立隨機值，至少 32 字元；建議 32 bytes hex             |
| `IP_ENCRYPTION_KEY`        | 獨立 32 bytes hex，共 64 個十六進位字元                 |
| `CRON_SECRET`              | 獨立隨機值，至少 32 字元                                |
| `ANALYTICS_RETENTION_DAYS` | 預設 `30`，允許 1–90                                    |
| `LOCAL_DEVELOPMENT`        | `false` 或不設定                                        |

所有私密值都是 server-only，禁止 `PUBLIC_` 前綴。不要將本機 `.env` 上傳 Git；不要重用本機測試金鑰。修改環境設定後重新部署。

首次使用 `*.vercel.app` 網域時，`SITE_URL` 與 OAuth callback 都必須對應當下的正式 origin。切換到 `waylan.cc` 後同步修改；SEO canonical 預設是 `https://waylan.cc`。

Preview 部署不收集訪客紀錄，避免污染 Production 統計；也不要為了預覽關閉來源驗證或放寬管理者權限。

## 5. 每日清理

`vercel.json` 已設定每日一次呼叫 `/api/cron/prune`。Vercel 以 `Authorization: Bearer CRON_SECRET` 驗證，缺少或錯誤的 secret 會拒絕執行。

排程為 UTC 04:00（台灣中午），Hobby 的排程精度以小時為單位，不能保證整點執行。後台查詢即時排除超過保存期限的紀錄；實體刪除在下一次成功排程進行，排程失敗應查 Vercel logs。[Cron 方案限制](https://vercel.com/docs/cron-jobs/usage-and-pricing)

## 6. 部署後確認

1. 首頁、17 個作品詳頁與 Archive 正常顯示。
2. 未登入時 `/admin/` 導向登入頁，`/api/admin/stats` 回傳 401。
3. GitHub 只有指定帳號能進入後台。
4. 瀏覽公開頁後，後台可看到新增紀錄、頁面與時間。
5. 瀏覽器開啟 DNT/GPC 或停用本站統計時，不新增造訪。
6. Vercel Cron 日誌顯示清理成功。

IP 來自 Vercel 覆寫的 `x-vercel-forwarded-for`，不接受 request body 的 IP。若在 Vercel 前再加反向代理，看到的可能是代理 IP；不以任意可偽造 header 補救。[Vercel request headers](https://vercel.com/docs/headers/request-headers)
