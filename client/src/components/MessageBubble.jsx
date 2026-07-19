import { useState } from 'react';
import axios from 'axios';
import SchemeDetailModal from './SchemeDetailModal';
import SchemeCard from './SchemeCard';
import { textToSpeech } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function downloadReport(schemeSlugs, language) {
  const res = await axios.post(`${API_URL}/report`, { schemeSlugs, language }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eligibility_report.pdf';
  a.click();
}

export default function MessageBubble({ message, language }) {
  const [playing, setPlaying] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const isUser = message.role === 'user';

  const handlePlay = async () => {
    try {
      setPlaying(true);
      const audioBase64 = await textToSpeech(message.text, message.language || language || 'en-IN');
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
          {message.schemes.map((s) => (
            <SchemeCard key={s.slug} scheme={s} onClick={setSelectedSlug} />
          ))}
          <button
            onClick={() => downloadReport(message.schemes.map((s) => s.slug), language || 'en-IN')}
            style={{ marginTop: 8 }}
          >
            📄 Download Eligibility Report (PDF)
          </button>
        </div>
      )}

      <SchemeDetailModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />
    </div>
  );
}