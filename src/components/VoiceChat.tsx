'use client'; // クライアントコンポーネントとして扱う

import { useCallback, useState, useRef } from 'react';
import { RealtimeAgent, RealtimeSession, type RealtimeItem } from '@openai/agents/realtime';

interface ExtendedRealtimeSession extends RealtimeSession {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export default function VoiceChat() {
  const sessionRef = useRef<ExtendedRealtimeSession | null>(null);
  const [history, setHistory] = useState<RealtimeItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      if (connected) return;
      setError(null);

      // マイクの権限をリクエスト
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 権限取得後、一時的にストリームを停止

      const { clientSecret } = await (await fetch('/api/voice-token', { method: 'POST' })).json();

      const agent = new RealtimeAgent({
        name: 'Assistant',
        instructions: 'You are a helpful assistant.',
      });

      const session = new RealtimeSession(agent, {
        model: 'gpt-4o-realtime-preview-2025-06-03',
      }) as ExtendedRealtimeSession;

      session.on('history_updated', setHistory);
      session.on('audio_interrupted', () => {
        console.log('⏸ Interrupted');
        setIsListening(false);
      });
      session.on('error', (e) => {
        console.error('Session error', e);
        setError('セッションエラーが発生しました');
      });

      await session.connect({ apiKey: clientSecret });
      sessionRef.current = session;
      setConnected(true);
    } catch (err) {
      console.error('Connection error:', err);
      setError('接続エラーが発生しました');
    }
  }, [connected]);

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
      setConnected(false);
      setHistory([]);
      setIsListening(false);
    }
  };

  const toggleListening = async () => {
    if (!sessionRef.current) return;

    try {
      if (isListening) {
        await sessionRef.current.stop();
      } else {
        await sessionRef.current.start();
      }
      setIsListening(!isListening);
    } catch (err) {
      console.error('Listening toggle error:', err);
      setError('音声入力の切り替えに失敗しました');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={connected ? disconnect : connect}
            className={`px-4 py-2 rounded-md font-medium ${
              connected
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {connected ? '切断' : '接続開始'}
          </button>
          {connected && (
            <button
              onClick={toggleListening}
              className={`px-4 py-2 rounded-md font-medium ${
                isListening
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isListening ? '音声入力を停止' : '音声入力を開始'}
            </button>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      <div className="space-y-4">
        {history.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              item.type === 'message'
                ? item.role === 'user'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
                : 'bg-yellow-100'
            }`}
          >
            {item.type === 'message' ? (
              <div className="flex items-start space-x-2">
                <span className="text-xl">
                  {item.role === 'user' ? '👤' : '🤖'}
                </span>
                <span className="flex-1">
                  {item.content[0]?.type === 'input_text' || item.content[0]?.type === 'text'
                    ? item.content[0].text
                    : item.content[0]?.type === 'input_audio'
                    ? item.content[0].transcript ?? ''
                    : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔧</span>
                <span>{item.type}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
