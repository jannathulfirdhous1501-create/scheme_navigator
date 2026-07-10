const sarvam = require('./sarvam');

async function extractProfile(userText) {
  const systemPrompt = `You are a profile extraction engine for an Indian government
scheme finder. Read the user's message and return ONLY a JSON object with these
fields (use null if unknown):
{ "age": number, "occupation": string, "gender": string, "state": string,
  "landAcres": number, "annualIncome": number, "category": string }
Return raw JSON only, no markdown, no explanation.`;

  const raw = await sarvam.chatComplete(systemPrompt, userText, { temperature: 0.1 });

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

async function generateReply(userText, matchedSchemes) {
  const script = sarvam.detectScript(userText);
  const scriptRule = sarvam.getScriptRule(script, userText);
  const languageCode = sarvam.scriptToLangCode(script, userText);

  const systemPrompt = `You are Yojana Mitra, a friendly assistant that explains
Indian government welfare schemes in simple, plain language.
Use the scheme data given to explain eligibility, benefits, required documents,
and how to apply. Keep the tone warm and simple. Avoid jargon.
If no schemes matched, politely say so and ask one clarifying question.

LANGUAGE INSTRUCTION:
${scriptRule}`;

  const schemeContext = JSON.stringify(matchedSchemes, null, 2);
  const userMessage = `User said: "${userText}"\n\nMatched schemes:\n${schemeContext}`;

  const reply = await sarvam.chatComplete(systemPrompt, userMessage, { temperature: 0.4 });
  return { reply, languageCode };
}

module.exports = { extractProfile, generateReply };