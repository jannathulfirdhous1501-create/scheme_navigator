import { useRef, useState } from 'react';
import { speechToText } from '../services/api';

// Encodes raw PCM audio samples into a real WAV file (browser-side, no backend conversion needed)
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export default function VoiceInput({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const samplesRef = useRef([]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    samplesRef.current = [];

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      samplesRef.current.push(new Float32Array(input));
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    setRecording(true);
  }

  async function stopRecording() {
    setRecording(false);
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const sampleRate = audioCtxRef.current.sampleRate;
    await audioCtxRef.current.close();

    const totalLength = samplesRef.current.reduce((sum, arr) => sum + arr.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of samplesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = encodeWAV(merged, sampleRate);

    setProcessing(true);
    try {
      const { transcript } = await speechToText(wavBlob);
      if (transcript?.trim()) onTranscript(transcript);
    } catch (err) {
      console.error('Speech-to-text failed:', err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={processing}
      title="Tap to speak"
    >
      {processing ? '⏳' : recording ? '⏹️ Stop' : '🎤 Speak'}
    </button>
  );
}