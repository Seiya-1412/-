import dynamic from 'next/dynamic';

const VoiceChat = dynamic(() => import('@/components/VoiceChat'), { ssr: false });

export default function Home() {
  return (
    <main>
      <h1>Realtime Voice Chat Demo</h1>
      <VoiceChat />
    </main>
  );
}
