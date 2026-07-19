const axios = require('axios');
const FormData = require('form-data');

const BASE = "https://api.sarvam.ai";
const KEY = process.env.SARVAM_API_KEY;

const headers = {
  'api-subscription-key': KEY,
  'Content-Type': 'application/json'
};

// ─────────────────────────────────────────────────────────
// Script detection — returns script name from Unicode ranges
// ─────────────────────────────────────────────────────────
const detectScript = (text) => {
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'malayalam';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'gurmukhi';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'odia';
  if (/^[A-Za-z0-9\s!@#$%^&*(),.?":{}|<>'`~\-_+=;/\\[\]]+$/.test(text)) return 'roman';
  return 'unknown';
};

// ─────────────────────────────────────────────────────────
// Shared Roman language regexes — single source of truth
// ─────────────────────────────────────────────────────────
const ROMAN_PATTERNS = [
  { lang: 'te-IN', label: 'Tenglish', desc: 'Telugu in Roman letters',
    re: /\b(untaya|lekapothe|undo|atho|mathrame|cheppandi|chala|bagundi|emi|ekkada|katti|mela|enadru|ideya|ayyindi|chesaru|ledu|avunu|unnaru|cheyyadam|adugutunnaru|telugu|meeru|maku|mee|nenu)\b/i },
  { lang: 'kn-IN', label: 'Kanglish', desc: 'Kannada in Roman letters',
    re: /\b(bekagide|thumba|swalpa|avru|navu|nimma|naanu|hogbeku|bandru|kelsa|barteeni|madtini|kannada|illi|enu|yenu|yelli|illa|ide|madu)\b/i },
  { lang: 'ml-IN', label: 'Manglish', desc: 'Malayalam in Roman letters',
    re: /\b(aano|alle|ente|njan|ningal|ivide|evide|enthanu|mathrame|adipoli|sheriyanu|undoo|ingane|engane|avr|avar|onnum|ellam|kittum|kittathe|thanne)\b/i },
  { lang: 'bn-IN', label: 'Banglish', desc: 'Bengali in Roman letters',
    re: /\b(jana|khub|dorkar|ache|hobe|korte|gele|ami|tumi|apni|lagbe|jacche|ashbe|thakbe|pabo|korbo|dekhun|bolun|kemon|kothay)\b/i },
  { lang: 'mr-IN', label: 'Marathish', desc: 'Marathi in Roman letters',
    re: /\b(ahe|pahije|hota|sakal|mazha|tumcha|aplya|aahe|yeil|jaail|milel|ghya|dya|sangto|bagha|asa|tasa|aplya|konti|vela)\b/i },
  { lang: 'ta-IN', label: 'Tanglish', desc: 'Tamil in Roman letters',
    re: /\b(enna|epdi|evlo|yaar|naan|sollu|illai|theriyum|iruku|romba|konjam|seri|nee|avan|aval|inge|paaru|pannuva|solla|kekkum|vendam|venum)\b/i },
  { lang: 'hi-IN', label: 'Hinglish', desc: 'Hindi in Roman letters',
    re: /\b(kahan|kya|hai|mein|aap|hum|yeh|woh|bhi|aur|nahi|haan|batao|bolo|chahiye|milega|kitna|kyun|kaisa|kab|dekho|suno|karo)\b/i }
];

const scriptToLangCode = (script, text) => {
  switch (script) {
    case 'devanagari': return 'hi-IN';
    case 'tamil':      return 'ta-IN';
    case 'malayalam':  return 'ml-IN';
    case 'telugu':     return 'te-IN';
    case 'kannada':    return 'kn-IN';
    case 'bengali':    return 'bn-IN';
    case 'gujarati':   return 'gu-IN';
    case 'gurmukhi':   return 'pa-IN';
    case 'odia':       return 'or-IN';
    case 'roman': {
      for (const pattern of ROMAN_PATTERNS) {
        if (pattern.re.test(text)) return pattern.lang;
      }
      return 'en-IN';
    }
    default: return 'en-IN';
  }
};

const getScriptRule = (script, text) => {
  switch (script) {
    case 'devanagari':
      return `CRITICAL: User wrote in Devanagari script. Reply ENTIRELY in Devanagari/Hindi script. No Roman letters.`;
    case 'tamil':
      return `CRITICAL: User wrote in Tamil script. Reply ENTIRELY in Tamil script. No English or Roman letters.`;
    case 'malayalam':
      return `CRITICAL: User wrote in Malayalam script. Reply ENTIRELY in Malayalam script. No English or Roman letters.`;
    case 'telugu':
      return `CRITICAL: User wrote in Telugu script. Reply ENTIRELY in Telugu script. No English or Roman letters.`;
    case 'kannada':
      return `CRITICAL: User wrote in Kannada script. Reply ENTIRELY in Kannada script. No English or Roman letters.`;
    case 'bengali':
      return `CRITICAL: User wrote in Bengali script. Reply ENTIRELY in Bengali script. No English or Roman letters.`;
    case 'roman': {
      for (const pattern of ROMAN_PATTERNS) {
        if (pattern.re.test(text)) {
          return `User is writing ${pattern.label} (${pattern.desc}). Reply in ${pattern.label} — mix that language and English words using only Roman script. Do NOT use native script.`;
        }
      }
      return `User is writing in English. Reply in clear, simple English.`;
    }
    default:
      return `Match the user's language exactly.`;
  }
};

// ─────────────────────────────────────────────────────────
// Smart TTS truncation — cuts at sentence boundary
// ─────────────────────────────────────────────────────────
const smartTruncate = (text, maxChars = 800) => {
  if (text.length <= maxChars) return text;
  const chunk = text.substring(0, maxChars);
  const lastPunct = Math.max(
    chunk.lastIndexOf('।'), chunk.lastIndexOf('.'),
    chunk.lastIndexOf('?'), chunk.lastIndexOf('!'), chunk.lastIndexOf('。')
  );
  if (lastPunct > maxChars * 0.5) return chunk.substring(0, lastPunct + 1).trim();
  const lastSpace = chunk.lastIndexOf(' ');
  return lastSpace > 0 ? chunk.substring(0, lastSpace).trim() : chunk.trim();
};

// ─────────────────────────────────────────────────────────
// Detect language (for badge / TTS target)
// ─────────────────────────────────────────────────────────
const detectLanguage = async (text) => {
  const script = detectScript(text);
  return scriptToLangCode(script, text);
};

// ─────────────────────────────────────────────────────────
// Generic chat call — used by llmService.js for BOTH
// profile extraction and scheme-reply generation
// ─────────────────────────────────────────────────────────
const chatComplete = async (systemPrompt, userText, opts = {}) => {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText || '' }
    ];

    const res = await axios.post(`${BASE}/v1/chat/completions`, {
      model: 'sarvam-30b',
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: 800,
      reasoning_effort: null // disables thinking mode — this is the real fix
    }, { headers, timeout: 30000 });

    const choice = res.data.choices?.[0]?.message;
    let reply = choice?.content;

    if (!reply && choice?.reasoning_content) {
      console.error('❌ LLM content still empty, finish_reason:', res.data.choices?.[0]?.finish_reason);
      const reasoning = choice.reasoning_content;
      const lines = reasoning.split(/\n+/).filter(l => l.trim().length > 20);
      reply = lines[lines.length - 1]?.trim();
    }

    if (!reply) {
      return "Sorry, I'm having trouble responding right now. Could you please rephrase that?";
    }

    return reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (error) {
    console.error("❌ LLM Error:", error.response?.status, error.response?.data?.error?.message || error.message);
    throw error;
  }
};
const speechToText = async (audioBuffer) => {
  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: 'audio.wav',
    contentType: 'audio/wav',
    knownLength: audioBuffer.length   // ADD THIS
  });
  form.append('model', 'saaras:v3');
  form.append('language_code', 'unknown');

  try {
    const res = await axios.post(`${BASE}/speech-to-text`, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Length': form.getLengthSync(),   // ADD THIS
        'api-subscription-key': KEY
      },
      timeout: 60000
    });
    return {
      transcript: res.data.transcript || "",
      languageCode: res.data.language_code || 'en-IN'
    };
  } catch (error) {
    console.error("❌ STT Error:", error.response?.data || error.message);
    return { transcript: "", languageCode: "en-IN" };
  }
};

// ─────────────────────────────────────────────────────────
// Text to Speech
// ─────────────────────────────────────────────────────────
const textToSpeech = async (text, langCode = 'en-IN') => {
  try {
    if (!text || text.trim().length === 0) return null;
    const ttsText = smartTruncate(text, 800);

    const res = await axios.post(`${BASE}/text-to-speech`, {
      text: ttsText,
      target_language_code: langCode,
      speaker: 'anushka',
      model: 'bulbul:v2',
      pitch: 0,
      pace: 1.0
    }, { headers, timeout: 30000 });

    return res.data?.audios?.[0] || null;
  } catch (error) {
    const errMsg = error.code || error.message || '';
    if (!errMsg.includes('ABORTED') && !errMsg.includes('ECONNRESET')) {
      console.error("❌ TTS Error:", error.response?.data || error.message);
    }
    return null;
  }
};

module.exports = {
  detectScript,
  scriptToLangCode,
  getScriptRule,
  detectLanguage,
  chatComplete,
  speechToText,
  textToSpeech
};