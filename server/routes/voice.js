const express = require('express');
const multer = require('multer');
const router = express.Router();
const sarvam = require('../services/sarvam');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'audio file is required' });
    const result = await sarvam.speechToText(req.file.buffer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Speech-to-text failed', debug: err.message });
  }
});

router.post('/tts', async (req, res) => {
  try {
    const { text, languageCode = 'en-IN' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const audioBase64 = await sarvam.textToSpeech(text, languageCode);
    if (!audioBase64) {
      return res.status(502).json({ error: 'TTS generation failed' });
    }
    res.json({ audio: audioBase64 });
  } catch (err) {
    res.status(500).json({ error: 'Text-to-speech failed', debug: err.message });
  }
});

module.exports = router;