好的 Ansen，我幫你把剛剛那份架構壓縮成一組 Milestone，方便你規劃開發進度。

⸻

Google Classroom 作業評分前端 — 開發 Milestone

Milestone 1：基礎環境與 OAuth ✅ COMPLETED
	•	✅ 完成專案初始化（Next.js 15.5.0 App Router / React 19 / TypeScript 5.7 / Tailwind CSS 3.4）
	•	✅ 設置開發環境（ESLint、Jest、React Testing Library）
	•	✅ 實作 Folder URL → Folder ID 解析函式（支援多種格式）
	•	✅ 撰寫完整單元測試（18 個測試全部通過）
	•	✅ 建立響應式前端界面
	•	✅ 錯誤處理和驗證機制
	•	⚠️  Google OAuth 整合（將在 Milestone 2 完成）

👉 交付：✅ 完全達成 - 前端輸入 Google Drive Folder URL 並成功解析 ID + 所有測試通過

測試結果（2025-08-22）：
- ✅ 單元測試：18/18 通過
- ✅ ESLint 檢查：無錯誤
- ✅ 生產建構：成功
- ✅ 開發伺服器：localhost:3000 運行正常
- ✅ 功能驗證：URL 解析、錯誤處理、UI 互動

⸻

Milestone 2：Drive API 整合
	•	實作 Drive API 列檔功能（只抓第一層，不遞迴）
	•	支援 supportsAllDrives/includeItemsFromAllDrives 參數
	•	實作單檔案下載（get?alt=media）與 Google Docs 匯出（/export）
	•	UI 上能顯示檔案清單、大小、MIME type

👉 交付：能選取一個 Folder，顯示檔案清單並下載檔案（暫存於前端記憶體）。

⸻

Milestone 3：AnythingLLM 接口與 JSON Schema 驗證
	•	定義 Grade JSON Schema（Zod）
	•	建立呼叫 AnythingLLM /api/grade API 模組
	•	驗證回傳 JSON 是否符合 Schema（不符 → 標記錯誤）
	•	UI 顯示每檔案的處理狀態（Queued / Running / Done / Failed）

👉 交付：能對多個檔案批次送審，並在 UI 表格中顯示成績或錯誤。

⸻

Milestone 4：批次控制與錯誤處理
	•	併發控制（PQueue / concurrency 設定）
	•	支援 Timeout 與重試策略（Drive 429/5xx, LLM Schema fail）
	•	UI 顯示進度列與「重試失敗項」功能

👉 交付：穩定處理 >50 檔案，失敗能重試。

⸻

Milestone 5：成績匯出
	•	成績彙整：score、rubric 細項、comments
	•	匯出 xlsx（SheetJS）
	•	提供一鍵複製 CSV/TSV（可直接貼入 Excel）

👉 交付：能匯出完整成績檔，助教可直接打開 Excel 使用。

⸻

Milestone 6：對話框與規則增量
	•	實作右側對話框，允許輸入「放寬/嚴格」或特定 rubric 調整
	•	將自然語言規則轉換為 Prompt 增量（或內部結構化規則）
	•	支援重新跑流程（全檔重算 / 僅重算成績）

👉 交付：使用者可透過對話調整評分標準並重新得到更新後的成績。

⸻

Milestone 7：穩定性與部署
	•	健康檢查 UI（OAuth token 狀態、LLM /healthz）
	•	錯誤日誌與使用者提示
	•	部署至 Vercel / Netlify（或自家環境）
	•	撰寫 README 與 PRD 簡報

👉 交付：可供實際課程使用的 MVP。