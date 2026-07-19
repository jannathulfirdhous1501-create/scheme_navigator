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
 
// server/services/llmService.js — replace extractProfile with this
async function extractProfile(userText, existingProfile = {}) {
  const systemPrompt = `You are a profile extraction engine for an Indian government
scheme finder. Read the conversation and update the JSON profile with any new
information found. Existing profile: ${JSON.stringify(existingProfile)}

Return ONLY the merged JSON object with these fields (keep existing values if
not mentioned, use null if still unknown):
{ "age": number, "gender": string, "occupation": string, "education": string,
  "caste": string, "state": string, "annualIncome": number, "needCategory": string }

Return raw JSON only, no markdown, no explanation.`;

  const raw = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText }
  ]);

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return existingProfile;
  }
}

const REQUIRED_FIELDS = ['age', 'gender', 'occupation', 'education', 'caste', 'state', 'annualIncome', 'needCategory'];

function getMissingFields(profile) {
  return REQUIRED_FIELDS.filter((f) => profile[f] === null || profile[f] === undefined);
}

async function askForMissingInfo(missingFields, language) {
  const fieldLabels = {
    age: 'age', gender: 'gender', occupation: 'occupation/profession',
    education: 'education level', caste: 'category (General/OBC/SC/ST)',
    state: 'state of residence', annualIncome: 'annual family income',
    needCategory: 'what kind of help you need (education, housing, healthcare, etc.)'
  };
  const list = missingFields.map((f) => fieldLabels[f]).join(', ');

  return callLLM([
    { role: 'system', content: `You are Yojana Mitra. Reply in ${language}. Ask the user for ALL of the following details in a single, friendly message (not one at a time): ${list}. Keep it short and simple.` },
    { role: 'user', content: 'Ask me for the missing details.' }
  ]);
}

module.exports = { callLLM, extractProfile, getMissingFields, askForMissingInfo, generateReply };
 
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
