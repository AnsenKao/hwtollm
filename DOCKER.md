# Docker 部署指南

## 🐳 Docker 建構和運行

### 1. 準備環境變數

如果您還沒有環境變數文件，複製範例文件：
```bash
cp .env.example .env.local
```

編輯 `.env.local` 文件，填入您的實際配置值。

**注意：** Docker Compose 會自動讀取您的 `.env.local` 文件！

### 2. 使用 Docker Compose（推薦）

建構和啟動服務：
```bash
docker-compose up --build
```

背景運行：
```bash
docker-compose up -d --build
```

停止服務：
```bash
docker-compose down
```

檢查運行狀態：
```bash
docker-compose ps
```

查看日誌：
```bash
docker-compose logs -f hwtollm
```

### 3. 使用 Docker 命令

建構映像：
```bash
docker build -t hwtollm .
```

運行容器：
```bash
docker run -p 3000:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=your-secret-key \
  -e GOOGLE_CLIENT_ID=your-google-client-id \
  -e GOOGLE_CLIENT_SECRET=your-google-client-secret \
  -e NEXT_PUBLIC_ANYTHINGLLM_API_URL=http://localhost:3001/api \
  -e NEXT_PUBLIC_ANYTHINGLLM_API_KEY=your-api-key \
  -e NEXT_PUBLIC_DEV_MODE=false \
  hwtollm
```

## 🔧 環境變數說明

| 變數名稱 | 說明 | 必填 |
|---------|------|-----|
| `NEXTAUTH_URL` | NextAuth.js 回調 URL | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js 加密密鑰 | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth 客戶端 ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客戶端密鑰 | ✅ |
| `NEXT_PUBLIC_ANYTHINGLLM_API_URL` | AnythingLLM API 端點 | ✅ |
| `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` | AnythingLLM API 密鑰 | ✅ |
| `NEXT_PUBLIC_DEV_MODE` | 開發模式開關 | ❌ |

## 🚀 部署到生產環境

### 使用 Docker Hub

1. 標記映像：
```bash
docker tag hwtollm your-username/hwtollm:latest
```

2. 推送到 Docker Hub：
```bash
docker push your-username/hwtollm:latest
```

3. 在生產服務器上拉取並運行：
```bash
docker pull your-username/hwtollm:latest
docker run -d -p 3000:3000 --env-file .env your-username/hwtollm:latest
```

### 使用 docker-compose 部署

在生產服務器上：
```bash
git clone <repository>
cd hwtollm
cp .env.example .env
# 編輯 .env 文件
docker-compose up -d --build
```

## 📊 監控和日誌

查看日誌：
```bash
docker-compose logs -f hwtollm
```

查看運行狀態：
```bash
docker-compose ps
```

## 🔧 故障排除

### 建構失敗
1. 確保 Docker 版本支援多階段建構
2. 檢查網絡連接是否正常
3. 清理 Docker 快取：`docker system prune -a`

### 運行時錯誤
1. 檢查環境變數是否正確設定
2. 確保依賴服務（AnythingLLM）正在運行
3. 檢查端口是否被佔用

### 性能優化
- 使用 Docker 的多階段建構減少映像大小
- 設定適當的記憶體限制
- 使用 Alpine Linux 基礎映像
