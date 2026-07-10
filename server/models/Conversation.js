const mongoose = require('mongoose');
 
const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userMessage: { type: String, required: true },
  botReply: { type: String, required: true },
  matchedSchemes: [{ type: String }],
  language: { type: String, default: 'en-IN' },
  createdAt: { type: Date, default: Date.now }
});
 
module.exports = mongoose.model('Conversation', conversationSchema);
