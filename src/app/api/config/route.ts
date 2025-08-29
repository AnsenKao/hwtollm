import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    NEXT_PUBLIC_ANYTHINGLLM_API_URL: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_URL,
    NEXT_PUBLIC_ANYTHINGLLM_API_KEY: process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY,
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
  })
}
