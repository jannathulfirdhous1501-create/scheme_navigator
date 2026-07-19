const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { speechToText } = require('../services/sarvam');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    const result = await speechToText(req.file.buffer);
    res.json(result);
  } catch (err) {
    console.error('[voice/stt] Error:', err.message);
    res.status(500).json({ error: 'STT failed' });
  }
});

router.post('/tts', async (req, res) => {
  try {
    const { text, languageCode } = req.body;

    const response = await axios.post('https://api.vachana.ai/api/v1/tts/inference', {
      text,
      voice: 'Simran',
      language: languageCode || 'en-IN',
      model: 'vachana-voice-v3',
      audio_config: { sample_rate: 22050, encoding: 'linear_pcm', container: 'wav', num_channels: 1, sample_width: 2 }
    }, {
      headers: { 'X-API-Key-ID': process.env.GNANI_API_KEY },
      responseType: 'arraybuffer'
    });

    res.json({ audio: Buffer.from(response.data).toString('base64') });
  } catch (err) {
    const detail = err.response?.data ? Buffer.from(err.response.data).toString('utf-8') : err.message;
    console.error('[voice/tts] Error:', detail);
    res.status(500).json({ error: 'TTS failed' });
  }
});

module.exports = router;