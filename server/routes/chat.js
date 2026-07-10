const express = require('express');
const router = express.Router();
const { extractProfile, generateReply } = require('../services/llmService');
const { matchSchemes } = require('../services/schemeMatcher');
const Conversation = require('../models/Conversation');

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'guest' } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const profile = await extractProfile(message);
    const matched = matchSchemes(profile);
    const { reply, languageCode } = await generateReply(message, matched);

    await Conversation.create({
      sessionId,
      userMessage: message,
      botReply: reply,
      matchedSchemes: matched.map((s) => s.name),
      language: languageCode
    });

    res.json({ reply, schemes: matched, profile, language: languageCode });
  } catch (err) {
    res.status(500).json({
      error: 'Something went wrong. Please try again.',
      debug: err.response?.data || err.message
    });
  }
});

module.exports = router;