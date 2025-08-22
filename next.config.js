/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    ANYTHING_LLM_API_URL: process.env.ANYTHING_LLM_API_URL,
    ANYTHING_LLM_API_KEY: process.env.ANYTHING_LLM_API_KEY,
  },
}

module.exports = nextConfig
