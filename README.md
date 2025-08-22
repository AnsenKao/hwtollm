# HW to LLM - Google Classroom 作業評分系統

使用 LLM 自動評分 Google Classroom 作業的前端工具。

## 🎯 專案目標

- 以「貼上 Google Drive 資料夾 URL + 評分 Prompt」為唯一入口
- 僅抓取該資料夾第一層檔案（不遞迴）
- 批次將檔案與 Prompt 送至 AnythingLLM 評分
- 產出可匯入 Excel 的成績檔（xlsx/CSV/TSV）
- 內建對話框，能追加/調整評分規則並重新跑流程

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用程式。

### 運行測試

```bash
npm test
```

### 代碼檢查

```bash
npm run lint
```

## 📋 開發進度

### ✅ Milestone 1: 基礎環境與 OAuth

- [x] Next.js 14 + TypeScript + Tailwind CSS 專案初始化
- [x] 開發環境設置（ESLint、Jest、Testing Library）
- [x] Google Drive URL 解析功能
- [x] 基礎 UI 界面
- [x] 單元測試
- [ ] Google OAuth 整合（進行中）

### 🔄 Milestone 2: Drive API 整合

- [ ] Drive API 列檔功能（只抓第一層）
- [ ] 支援 supportsAllDrives/includeItemsFromAllDrives 參數
- [ ] 單檔案下載與 Google Docs 匯出
- [ ] UI 顯示檔案清單

## 🛠️ 技術棧

- **前端框架**: Next.js 15.5.0 with App Router
- **語言**: TypeScript 5.7.3
- **樣式**: Tailwind CSS 3.4.17
- **測試**: Jest 29.7.0 + React Testing Library 16.3.0
- **程式碼品質**: ESLint 8.57.1
- **狀態管理**: React useState (未來可能升級到 Zustand)

## 📁 專案結構

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # 全域樣式
│   ├── layout.tsx      # 根佈局
│   └── page.tsx        # 主頁面
├── components/         # React 元件
├── services/          # API 服務
├── types/             # TypeScript 類型定義
└── utils/             # 工具函數
    ├── helpers.ts     # URL 解析等工具函數
    └── __tests__/     # 單元測試
```

## 🔧 環境變數

複製 `.env.example` 到 `.env.local` 並填入相關設定：

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AnythingLLM API
ANYTHING_LLM_API_URL=your_anything_llm_api_url
ANYTHING_LLM_API_KEY=your_anything_llm_api_key
```

## 📝 測試 URL 格式

系統支援以下 Google Drive URL 格式：

- `https://drive.google.com/drive/folders/[FOLDER_ID]`
- `https://drive.google.com/drive/folders/[FOLDER_ID]?usp=sharing`
- `https://drive.google.com/drive/u/0/folders/[FOLDER_ID]`

## 🤝 開發指南

1. 遵循 TypeScript 嚴格模式
2. 使用 ESLint 保持代碼品質
3. 撰寫單元測試覆蓋核心功能
4. 使用 Tailwind CSS 進行樣式設計
5. 遵循 Next.js App Router 最佳實踐

## 📄 授權

MIT License
