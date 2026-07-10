import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import QuickChips from './QuickChips';
import VoiceInput from './VoiceInput';

export default function ChatWindow() {
  const { messages, loading, send } = useChat();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  const handleTranscript = (transcript) => {
    if (transcript?.trim()) send(transcript);
  };

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="logo">YM</div>
        <div>
          <h1>Yojana Mitra</h1>
          <p>Your government scheme friend</p>
        </div>
      </header>

      <div className="chat-body">
        {messages.length === 0 && (
          <div className="welcome">
            <p>Tell me about yourself — I'll find schemes you're eligible for.</p>
            <QuickChips onSelect={send} />
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {loading && <div className="typing">Yojana Mitra is thinking…</div>}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="e.g. I am a 45-year-old farmer in Odisha with 2 acres…"
        />
        <VoiceInput onTranscript={handleTranscript} />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}