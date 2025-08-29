# 使用官方 Node.js 18 Alpine 鏡像作為基礎
FROM node:18-alpine AS base

# 安裝必要的系統依賴
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 複製 package 文件
COPY package.json package-lock.json* ./

# 安裝依賴階段
FROM base AS deps
RUN npm ci --only=production

# 建構階段
FROM base AS builder

COPY . .

# 安裝所有依賴（包括 devDependencies）
RUN npm ci
# 建構應用
RUN npm run build

# 生產階段
FROM base AS runner

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 設定環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 複製建構產物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 創建 public 目錄（Next.js 可能需要）
RUN mkdir -p ./public

# 切換到非 root 用戶
USER nextjs

# 暴露端口
EXPOSE 3000

# 設定環境變數
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動應用
CMD ["node", "server.js"]
