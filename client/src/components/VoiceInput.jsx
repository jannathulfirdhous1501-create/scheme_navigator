
import { useVoice } from '../hooks/useVoice';
import styles from '../styles/ChatWindow.module.css';

export default function VoiceInput({ onTranscript }) {
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

  const handleClick = async (e) => {
    e.preventDefault();

    if (isRecording) {
      const result = await stopRecording();
      if (result?.transcript && result.transcript.trim().length > 0) {
        onTranscript(result.transcript, result.languageCode);
      }
    } else {
      try {
        await startRecording();
      } catch (err) {
        console.error("Mic access denied or error:", err);
      }
    }
  };

  // Pick label based on state
  const label = isTranscribing
    ? '⏳'
    : isRecording
    ? '⏹'
    : '🎙';

  return (
    <div className={styles.voiceWrap}>
      <button
        onClick={handleClick}
        className={`${styles.voiceBtn} ${isRecording ? styles.voiceRecording : ''} ${isTranscribing ? styles.voiceProcessing : ''}`}
        disabled={isTranscribing}
        type="button"
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        title={isRecording ? 'Stop' : isTranscribing ? 'Processing...' : 'Speak'}
      >
        <span className={styles.voiceIcon}>{label}</span>
        <span className={styles.voiceLabel}>
          {isTranscribing ? 'Processing' : isRecording ? 'Stop' : 'Speak'}
        </span>
      </button>

      {isRecording && (
        <span className={styles.listeningDot} aria-live="polite" />
      )}
    </div>
  );
}