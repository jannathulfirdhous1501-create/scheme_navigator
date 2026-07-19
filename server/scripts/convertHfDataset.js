// server/scripts/convertHfDataset.js
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/raw_hf_schemes.json'), 'utf8'));
const rows = Array.isArray(raw) ? raw : raw.data || raw.rows || [];

function slugify(name) {
  return (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const schemes = rows.map((r) => ({
  name: r.scheme_name || r.name || r.title,
  slug: r.slug || slugify(r.scheme_name || r.name),
  eligibility: r.eligibility || r.eligibility_criteria || '',
  benefits: r.benefits || '',
  documents: r.documents || r.required_documents || '',
  applicationSteps: r.application || r.application_process || r.how_to_apply || '',
  applicationLink: r.application_link || r.link || r.url || null,
  category: r.schemeCategory || r.category || 'General',
  level: r.level || 'Central',
  tags: (r.tags || '').toString().split(',').map((t) => t.trim()).filter(Boolean),
  description: r.details || r.description || ''
})).filter(s => s.name);

fs.writeFileSync(path.join(__dirname, '../data/schemes.json'), JSON.stringify(schemes, null, 2));
console.log(`Converted ${schemes.length} schemes.`);