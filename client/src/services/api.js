import axios from 'axios';
 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
 
export async function sendMessage(message, language, sessionId) {
  const { data } = await axios.post(`${API_URL}/chat`, { message, language, sessionId });
  return data;
}
export async function speechToText(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const { data } = await axios.post(`${API_URL}/voice/stt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; // { transcript, languageCode }
}
export async function textToSpeech(text, languageCode) {
  const { data } = await axios.post(`${API_URL}/voice/tts`, { text, languageCode });
  return data.audio; // base64 string
}
