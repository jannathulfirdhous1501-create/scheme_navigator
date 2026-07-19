const express = require('express');
const router = express.Router();
const { extractProfile, getMissingFields, askForMissingInfo, generateReply } = require('../services/llmService');
const { matchSchemes } = require('../services/schemeMatcher');
const Conversation = require('../models/Conversation');

// In-memory session state (profile + last-asked fields) — no DB model change needed
const sessionState = new Map();

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'guest' } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const state = sessionState.get(sessionId) || { profile: {}, lastAskedFields: [] };

    const updatedProfile = await extractProfile(message, state.profile, state.lastAskedFields);
    const missing = getMissingFields(updatedProfile);

    sessionState.set(sessionId, { profile: updatedProfile, lastAskedFields: missing });

    let reply, matched = [], profileComplete = false;

    if (missing.length > 0) {
      reply = await askForMissingInfo(missing, message);
    } else {
      matched = matchSchemes(updatedProfile, message);
      reply = await generateReply(message, matched, message);
      profileComplete = true;
    }

    await Conversation.create({
      sessionId,
      userMessage: message,
      botReply: reply,
      matchedSchemes: matched.map((s) => s.name)
    });

    res.json({
      reply,
      schemes: matched.map((s) => ({ name: s.name, slug: s.slug })),
      profile: updatedProfile,
      profileComplete
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;