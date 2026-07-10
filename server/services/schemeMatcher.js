const schemes = require('../data/schemes.json');
 
function matchSchemes(profile) {
  return schemes.filter((scheme) => {
    const e = scheme.eligibility;
 
    if (e.occupation && !e.occupation.includes('any') && profile.occupation
      && !e.occupation.includes(profile.occupation.toLowerCase())) {
      return false;
    }
 
    if (e.minAge && profile.age && profile.age < e.minAge) return false;
    if (e.maxAge && profile.age && profile.age > e.maxAge) return false;
 
    if (e.landMaxAcres && profile.landAcres && profile.landAcres > e.landMaxAcres) {
      return false;
    }
 
    if (e.incomeMaxAnnual && profile.annualIncome && profile.annualIncome > e.incomeMaxAnnual) {
      return false;
    }
 
    if (e.gender && !e.gender.includes('any') && profile.gender
      && !e.gender.includes(profile.gender.toLowerCase())) {
      return false;
    }
 
    return true;
  }).slice(0, 5);
}
 
module.exports = { matchSchemes };
