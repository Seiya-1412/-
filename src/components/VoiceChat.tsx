'use client';

import { useCallback, useState, useRef } from 'react';
import { RealtimeAgent, RealtimeSession, type RealtimeItem } from '@openai/agents/realtime';

export default function VoiceChat() {
  // useRef の型を RealtimeSession | null に変更
  const sessionRef = useRef<RealtimeSession | null>(null);  
  const [history, setHistory] = useState<RealtimeItem[]>([]);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(async () => {
    if (connected) return;
    const { clientSecret } = await (await fetch('/api/voice-token', { method: 'POST' })).json();

    const agent = new RealtimeAgent({
      name: 'Assistant',
      instructions: 'You are a helpful assistant.',
    });

    const session = new RealtimeSession(agent, {
      model: 'gpt-4o-realtime-preview-2025-06-03',
    });

    session.on('history_updated', setHistory);
    session.on('audio_interrupted', () => console.log('⏸ Interrupted'));
    session.on('error', (e) => console.error('Session error', e));

    await session.connect({ apiKey: clientSecret });
    sessionRef.current = session;
    setConnected(true);
  }, [connected]);

  const disconnect = () => {
    // sessionRef.current が null でないことを確認してから disconnect を呼び出す
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;  // close の後にリセット
      setConnected(false);
      setHistory([]);
    } else {
      console.error("No active session to disconnect.");
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={connected ? disconnect : connect}>
        {connected ? 'Disconnect' : 'Start Voice Chat'}
      </button>
      <div className="whitespace-pre-wrap">
        {history.map((item, idx) => (
          <p key={idx}>
            {item.type === 'message' ? `${item.role === 'user' ? '👤' : '��'} ${
              item.content[0]?.type === 'input_text' || item.content[0]?.type === 'text' ? item.content[0].text :
              item.content[0]?.type === 'input_audio' ? item.content[0].transcript ?? '' : ''
            }` : `🔧 ${item.type}`}
          </p>
        ))}
      </div>
    </div>
  );
}
