# 訪問統計

## 收集與閱讀

公開頁面的 JavaScript 送出同源 POST，伺服器從可信連線來源取得 IP，驗證頁面路徑並寫入資料庫。後台顯示有效瀏覽、不同 IP、被造訪頁面、每日趨勢、熱門頁面、來源網域與分頁紀錄；可依 1／7／30 天、完整 IP 及頁面篩選。

這是瀏覽器頁面統計，不是完整 Web access log。關閉 JavaScript、隱私訊號、封鎖請求或網路錯誤都會少計。不同 IP 不等於不同人，同一網路、VPN、IPv6 與動態位址都會影響結果。

## 儲存

- `ip_encrypted`：AES-256-GCM 加密，隨機 nonce，驗證完整性。
- `ip_hash`：HMAC，用於統計及篩選；金鑰與加密同屬 server-only 設定，使用不同用途字串。
- `path`：只能是網站已知的公開頁面，不記錄 query string。
- `referrer_host`：僅儲存網域，丟棄完整來源 URL、query 及 fragment。
- `viewed_at`：伺服器時間；後台使用 Asia/Taipei 顯示。
- `country`：Vercel 提供的國家或地區代碼；無資訊時留空。

同一 IP、同頁面在同一分鐘合併一次；資料庫以唯一約束處理並發。每個 IP 每分鐘最多 60 次合格寫入嘗試。此限制能控制單一來源的寫入，不能替代 Vercel Firewall 的流量管理，也不會免除被拒絕請求本身的 Function 用量。

## 管理者保護

GitHub OAuth 使用 state、PKCE 與固定 callback origin。登入身分符合指定數字 ID 後發行 8 小時簽章 Cookie；Cookie 使用 HttpOnly、SameSite=Lax，正式環境使用 Secure。登出清除 Cookie；輪替 `SESSION_SECRET` 可使現有簽章失效。

統計 API 驗證 Cookie 與管理者 ID後才解密 IP。後台頁面及 API 使用 `private, no-store`，不進入 sitemap，標示 noindex。來源字串使用文字節點輸出，不當作 HTML。

正式環境未設定資料庫、登入或金鑰時不提供開發預覽登入。只允許 Astro DEV、明確本機設定及 loopback 的 `/api/auth/local`，正式建置中固定不可用。

## 保存與金鑰

紀錄預設 30 天，由每日排程刪除；超期資料不出現在後台。IP 金鑰輪替會影響既有 IP 解密與查詢，應先制定遷移或到期清除方式，不要直接覆蓋而期待舊資料仍可解密。

部署者仍需保護 Vercel、Neon 與 GitHub 帳號。資料庫備份與平台自身連線紀錄遵循服務提供者設定，與本網站的刪除排程不同。
