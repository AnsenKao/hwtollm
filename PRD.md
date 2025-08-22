Google Classroom 作業評分前端—系統架構（精簡版）

1) 目標與邊界
	•	以「貼上 Google Drive 資料夾 URL + 評分 Prompt」為唯一入口。
	•	僅抓取該資料夾第一層檔案（不遞迴）。
	•	批次將檔案與 Prompt 送至 AnythingLLM 評分，回傳僅接受 JSON 並做模型驗證。
	•	產出可匯入 Excel 的成績檔（xlsx/CSV/TSV）。
	•	內建對話框，能追加/調整評分規則並重新跑流程。

2) 角色與外部系統
	•	使用者（老師/助教）
	•	Google Drive API（讀取、下載/匯出檔案）
	•	AnythingLLM API（依 Prompt 產生評分 JSON）
	•	前端 Web 應用（單頁式）

3) 高層流程（非遞迴）
	1.	使用者輸入：Drive「資料夾 URL」＋「評分 Prompt」＋模型與基本設定。
	2.	前端解析 Folder ID → 呼叫 Drive API 列出第一層檔案。
	3.	逐檔下載（一般檔 get?alt=media；Google 編輯器檔 export 轉 OOXML）。
	4.	前端對每個檔案組合評分請求 → 呼叫 AnythingLLM → 取得 JSON 成績。
	5.	以固定 Schema 驗證回傳 → 彙整結果 → 匯出 xlsx/CSV/TSV。
	6.	對話框追加規則（寬鬆/嚴格/特定 rubric 權重調整）→ 更新 Prompt → 重新評分或僅重算。

4) 元件劃分
	•	UI 層
	•	表單（URL、Prompt、模型、併發/超時）
	•	檔案清單（僅第一層）與勾選排除
	•	執行進度與結果表格、匯出區
	•	對話框（追加規則 → 顯示差異 → 重新執行）
	•	整合層
	•	Drive API 模組（列檔、下載/匯出、分頁處理、權限參數 supportsAllDrives/includeItemsFromAllDrives）
	•	LLM 評分模組（請求節流、重試、Schema 驗證）
	•	資料層
	•	設定（基準 Prompt、規則增量、模型、併發/超時）
	•	成績資料（原始 JSON、彙整後 rows、錯誤/重試狀態）
	•	匯出器（xlsx/CSV/TSV）

5) 資料契約（精簡）
	•	評分回傳（LLM → 前端）：

{
  fileName: string,
  score: number[0..100],
  rubric: [{ key, desc, weight(0..1), subScore(0..100) }]+,
  comments?: string,
  meta?: object
}


	•	不符合即標記錯誤並可重試。

6) 併發與可靠性
	•	以「檔案為單位」工作併發，限制最大併發數，超時可配置。
	•	失敗類型：Drive（403/404/429/5xx）、LLM（非 2xx、非 JSON、Schema 不符、超時）。
	•	策略：指數退避重試（429/5xx）、單檔重試按鈕、「只重跑失敗項」入口。
	•	進度可視化：Queued/Running/Done/Failed/Timeout。

7) 安全與合規
	•	Google OAuth（scope：drive.readonly），Token 儲存在記憶體；避免持久化。
	•	如需跨網域或內網 LLM：以前端→自家輕量代理（Route Handler）轉發，統一加上 API Key 與 CORS 控制。
	•	檔案型別白名單；Google 編輯器統一匯出 OOXML（docx/xlsx/pptx）/pdf（drawing）。

8) 匯出與回饋
	•	匯出：xlsx（主要）、CSV/TSV（備援與可貼上）。
	•	表格欄位：fileName / score / comments / error / rubric.key / rubric.desc / rubric.weight / rubric.subScore。
	•	對話框規則：以「增量」套用於基準 Prompt（例如全域嚴格+10%、或指定 rubric 權重調整），提供差異預覽與一次回滾。

9) 可維運性
	•	健康檢查：AnythingLLM /healthz、Drive token 狀態。
	•	記錄：前端捕捉每檔錯誤摘要（狀態碼、訊息、步驟），限制大小。
	•	參數化：模型、併發、超時、匯出格式、權重策略皆可在 UI 設定並保存為方案。

10) 交付與部署
	•	前端：單一 SPA（Next.js 14 App Router + TypeScript + Tailwind CSS），預設直連外部 API。
	•	開發環境：支援 Mock 模式，無需真實 Google OAuth 即可測試核心功能。
	•	若有企業網路限制：提供後端代理（僅轉發與最少邏輯）。
	•	測試：單元測試（Jest + React Testing Library）+ E2E 測試（Playwright）。
	•	文件：使用說明、OAuth 設定、API 端點清單、錯誤碼對照與常見情境。
