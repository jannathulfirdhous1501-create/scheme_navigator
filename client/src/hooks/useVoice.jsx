
import { useState, useRef, useCallback } from 'react';
import { speechToText } from '../services/api';

export const useVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return reject('No recorder');
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          const result = await speechToText(blob);
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    });
  }, []);

  return { isRecording, isTranscribing, startRecording, stopRecording };
};
