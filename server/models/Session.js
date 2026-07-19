// server/models/Session.js
const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  profile: { type: Object, default: {} },
  language: { type: String, default: 'en-IN' }
}, { timestamps: true });
module.exports = mongoose.model('Session', sessionSchema);