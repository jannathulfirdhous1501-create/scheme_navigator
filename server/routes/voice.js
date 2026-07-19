const express = require('express');
const multer = require('multer');
const { speechToText, textToSpeech } = require('../services/sarvam');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    const result = await speechToText(req.file.buffer); // already real WAV now, no conversion needed
    res.json(result);
  } catch (err) {
    console.error('[voice/stt] Error:', err.message);
    res.status(500).json({ error: 'STT failed' });
  }
});

router.post('/tts', async (req, res) => {
  try {
    const { text, languageCode } = req.body;
    const audio = await textToSpeech(text, languageCode || 'en-IN');
    res.json({ audio });
  } catch (err) {
    console.error('[voice/tts] Error:', err.message);
    res.status(500).json({ error: 'TTS failed' });
  }
});

module.exports = router;