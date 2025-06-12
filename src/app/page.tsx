'use client';  // クライアントサイドコンポーネントとして扱う

import dynamic from 'next/dynamic';

// VoiceChat コンポーネントを動的にインポート
const VoiceChat = dynamic(() => import('@/components/VoiceChat'));

export default function Home() {
  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Realtime Voice Chat Demo</h1>
      <VoiceChat />
    </main>
  );
}
