export const dynamic = 'force-dynamic';

// src/app/api/voice-token/route.ts
import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';  // AxiosErrorをインポート

// POST リクエストで OpenAI API から client_secret を取得
export async function POST() {
  try {
    // OpenAI API キーを環境変数から取得
    const { data } = await axios.post(
      'https://api.openai.com/v1/realtime/sessions',
      { model: 'gpt-4o-realtime-preview-2025-06-03' },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    // 成功した場合、client_secret を返す
    return NextResponse.json({ clientSecret: data.client_secret.value });
  } catch (e: unknown) {
    // エラーハンドリング
    if (e instanceof AxiosError) {
      console.error(e.response?.data ?? e);
    } else {
      console.error(e);
    }
    return new NextResponse('Failed to create session', { status: 500 });
  }
}
