const schemes = require('../data/schemes.json');

const STATE_NAMES = ['bihar', 'kerala', 'tamil nadu', 'karnataka', 'maharashtra', 'gujarat', 'punjab', 'odisha', 'assam', 'telangana', 'andhra pradesh', 'west bengal', 'rajasthan', 'madhya pradesh', 'uttar pradesh', 'haryana', 'jharkhand', 'chhattisgarh', 'goa', 'lakshadweep'];

function matchSchemes(profile, userText) {
  const queryText = `${profile.needCategory || ''} ${userText || ''}`.toLowerCase();
  const queryWords = queryText.split(/\s+/).filter((w) => w.length > 2);

  if (queryWords.length === 0) return [];

  const scored = schemes.map((s) => {
    const haystack = `${s.name} ${s.description || ''} ${s.eligibility || ''} ${s.benefits || ''} ${s.category || ''}`.toLowerCase();
    let score = 0;

    queryWords.forEach((word) => {
      if (haystack.includes(word)) score += 1;
    });

    if (profile.needCategory && haystack.includes(profile.needCategory.toLowerCase())) {
      score += 5;
    }

    if (profile.state && haystack.includes(profile.state.toLowerCase())) {
      score += 6;
    }

    const mentionedStates = STATE_NAMES.filter((st) => haystack.includes(st));
    if (mentionedStates.length > 0 && profile.state && !mentionedStates.includes(profile.state.toLowerCase())) {
      score -= 8;
    }

    return { ...s, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = { matchSchemes };