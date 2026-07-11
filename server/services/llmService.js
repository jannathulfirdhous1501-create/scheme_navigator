const axios = require('axios');
 
const SARVAM_URL = 'https://api.sarvam.ai/v1/chat/completions';
 
async function callLLM(messages) {
  const { data } = await axios.post(
    SARVAM_URL,
    { model: 'sarvam-30b', messages, temperature: 0.2 },   // was 'sarvam-m'
    { headers: { 'api-subscription-key': process.env.SARVAM_API_KEY } }
  );
  return data.choices[0].message.content;
}
 
async function extractProfile(userText) {
  const systemPrompt = `You are a profile extraction engine for an Indian government
scheme finder. Read the user's message and return ONLY a JSON object with these
fields (use null if unknown):
{ "age": number, "occupation": string, "gender": string, "state": string,
  "landAcres": number, "annualIncome": number, "category": string,
  "needCategory": string }

needCategory must be EXACTLY one of these strings (pick the closest match to
what the user is asking about), or null if unclear:
"Agriculture", "MSME", "Housing", "Healthcare", "Education", "Welfare", "Financial Inclusion"

Return raw JSON only, no markdown, no explanation.`;

  const raw = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText }
  ]);

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}
 
async function generateReply(userText, matchedSchemes, language) {
  const systemPrompt = `You are Yojana Mitra, a friendly assistant that explains
Indian government welfare schemes in simple, plain language. Reply in ${language}.
Use the scheme data given to explain eligibility, benefits, required documents,
and how to apply. Keep the tone warm and simple. Avoid jargon.
If no schemes matched, politely say so and ask one clarifying question.`;
 
  const schemeContext = JSON.stringify(matchedSchemes, null, 2);
 
  return callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `User said: "${userText}"\n\nMatched schemes:\n${schemeContext}` }
  ]);
}
 
module.exports = { extractProfile, generateReply };
