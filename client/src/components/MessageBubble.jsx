import { useState } from 'react';
import SchemeCard from './SchemeCard';
import { textToSpeech } from '../services/api';

export default function MessageBubble({ message }) {
  const [playing, setPlaying] = useState(false);
  const isUser = message.role === 'user';

  const handlePlay = async () => {
    try {
      setPlaying(true);
      const audioBase64 = await textToSpeech(message.text, message.language || 'en-IN');
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audio.onended = () => setPlaying(false);
      audio.play();
    } catch (err) {
      console.error('TTS playback failed:', err);
      setPlaying(false);
    }
  };

  return (
    <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
      <p>{message.text}</p>
      {!isUser && (
        <button onClick={handlePlay} disabled={playing} style={{ marginTop: 6, fontSize: '0.75rem' }}>
          {playing ? '🔊 Playing…' : '🔈 Listen'}
        </button>
      )}
      {message.schemes?.length > 0 && (
        <div className="scheme-list">
          {message.schemes.map((s) => <SchemeCard key={s.id} scheme={s} />)}
        </div>
      )}
    </div>
  );
}