const { chatComplete, detectScript, getScriptRule } = require('./sarvam');

async function extractProfile(userText, existingProfile = {}, lastAskedFields = []) {
  const contextHint = lastAskedFields.length > 0
    ? `\n\nIMPORTANT CONTEXT: The user was just asked for: ${lastAskedFields.join(', ')}. If their message is short/bare (a word or number), map it to ONE OR MORE of those fields by meaning.`
    : '';

  const systemPrompt = `Extract ONLY the fields mentioned or clearly implied in this message. Do not guess wildly, but DO use the context hint if given.
Return ONLY a JSON object with any of these fields you find (omit fields not mentioned):
{ "age": number, "gender": string, "occupation": string, "education": string,
  "caste": string, "state": string, "annualIncome": number, "needCategory": string }

needCategory must be EXACTLY one of these values, mapped from ANY mention (even implied), regardless of context:
"education"/"school"/"college"/"scholarship"/"fees" → "Education"
"housing"/"home"/"house"/"rent"/"construction" → "Housing"
"health"/"healthcare"/"medical"/"hospital"/"treatment" → "Healthcare"
"business"/"startup"/"MSME"/"shop"/"enterprise" → "MSME"
"farming"/"agriculture"/"crop"/"land"/"farmer" → "Agriculture"
"welfare"/"pension"/"widow"/"disability"/"senior" → "Welfare"
"loan"/"bank"/"credit"/"subsidy" (when not tied to education/housing/business specifically) → "Financial Inclusion"

Return raw JSON only, no markdown, no explanation. If this message is just a greeting with no info, return {}.${contextHint}`;

  let raw;
  try {
    raw = await chatComplete(systemPrompt, userText, { temperature: 0.1 });
  } catch (err) {
    console.error('extractProfile: LLM call failed, keeping existing profile:', err.message);
    return existingProfile;
  }

  let extracted = {};
  try {
    extracted = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    extracted = {};
  }

  return { ...existingProfile, ...extracted };
}

const REQUIRED_FIELDS = ['age', 'gender', 'occupation', 'education', 'caste', 'state', 'annualIncome', 'needCategory'];

function getMissingFields(profile) {
  // Ask needCategory FIRST, on its own, before anything else
  if (profile.needCategory === null || profile.needCategory === undefined || profile.needCategory === '') {
    return ['needCategory'];
  }
  return REQUIRED_FIELDS.filter((f) => f !== 'needCategory' && (profile[f] === null || profile[f] === undefined || profile[f] === ''));
}
const FIELD_LABELS = {
  age: 'age', gender: 'gender', occupation: 'occupation',
  education: 'education level', caste: 'category (General/OBC/SC/ST)',
  state: 'state', annualIncome: 'annual family income',
  needCategory: 'what kind of help you need (education, housing, healthcare, business, etc.)'
};

async function askForMissingInfo(missingFields, userText) {
  const list = missingFields.map((f) => FIELD_LABELS[f]).join(', ');
  const script = detectScript(userText);
  const scriptRule = getScriptRule(script, userText);

  const systemPrompt = `You are Yojana Mitra, a friendly government scheme assistant.
${scriptRule}
If the user's message is just a greeting (like "hello", "hi"), greet them warmly first in the same style/language, then ask for the details below.
Ask for ALL of these details in one short, friendly message: ${list}.`;

  try {
    return await chatComplete(systemPrompt, userText);
  } catch (err) {
    console.error('askForMissingInfo: LLM call failed:', err.message);
    return `Sorry, I had trouble processing that. Could you please tell me: ${list}?`;
  }
}

async function generateReply(userText, matchedSchemes, originalUserText) {
  const script = detectScript(originalUserText);
  const scriptRule = getScriptRule(script, originalUserText);

  const systemPrompt = `You are Yojana Mitra, a friendly assistant that explains
Indian government welfare schemes in simple, plain language.

${scriptRule}

Use the scheme data given to explain eligibility, benefits, required documents,
and how to apply. Keep the tone warm and simple. Avoid jargon.
If the matched schemes list is empty, politely say none matched well and ask one clarifying question — do not invent or describe unrelated schemes.
Keep your answer complete but not overly long — under 700 characters if possible, so it can be read aloud smoothly.`;

  const schemeContext = JSON.stringify(matchedSchemes, null, 2);
  const userContent = `User said: "${userText}"\n\nMatched schemes:\n${schemeContext}`;

  try {
    return await chatComplete(systemPrompt, userContent);
  } catch (err) {
    console.error('generateReply: LLM call failed:', err.message);
    return "Sorry, I'm having trouble right now. Please try again in a moment.";
  }
}
module.exports = { extractProfile, getMissingFields, askForMissingInfo, generateReply };