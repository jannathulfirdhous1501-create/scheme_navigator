import { useState } from 'react';
import { sendMessage } from '../services/api';

const sessionId = `session-${Date.now()}`;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { reply, schemes, language } = await sendMessage(text, sessionId);
      setMessages((prev) => [...prev, { role: 'bot', text: reply, schemes, language }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send };
}
