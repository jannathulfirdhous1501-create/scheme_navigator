const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Fix common mojibake from the CSV's encoding (â€™ → ', â‚¹ → ₹, etc.)
function fixEncoding(str) {
  if (!str) return str;
  return str
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\x9d/g, '"')
    .replace(/â‚¹/g, '₹')
    .replace(/ï»¿/g, '')
    .replace(/â€“/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitList(str) {
  if (!str) return [];
  return str
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => fixEncoding(s).replace(/\.$/, '').trim())
    .filter(Boolean);
}

const CSV_PATH = process.argv[2]; // pass path as argument
if (!CSV_PATH) {
  console.error('Usage: node convertCsv.js <path-to-csv>');
  process.exit(1);
}

const raw = fs.readFileSync(CSV_PATH, 'latin1'); // handles the mojibake source encoding
const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

const schemes = records.map((row, i) => ({
  id: row.slug || `scheme-${i}`,
  name: fixEncoding(row.scheme_name),
  description: fixEncoding(row.details),
  benefits: fixEncoding(row.benefits),
  eligibilityText: fixEncoding(row.eligibility),
  applicationProcess: fixEncoding(row.application),
  documents: splitList(row.documents),
  level: fixEncoding(row.level),
  category: fixEncoding(row.schemeCategory),
  tags: (row.tags || '').split(',').map((t) => fixEncoding(t)).filter(Boolean),
}));

const outPath = path.join(__dirname, '..', 'data', 'schemes.json');
fs.writeFileSync(outPath, JSON.stringify(schemes, null, 2));
console.log(`✅ Converted ${schemes.length} schemes → ${outPath}`);