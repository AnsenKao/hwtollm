/** @type {import('next').NextConfig} */
const nextConfig = {
  // 啟用 standalone 模式以優化 Docker 建構
  output: 'standalone',
  
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // NEXT_PUBLIC_ 環境變數會自動在客戶端可用，不需要在這裡配置
  },
}

module.exports = nextConfig
