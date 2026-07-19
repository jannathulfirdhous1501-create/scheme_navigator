// server/routes/report.js
const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();
const schemes = require('../data/schemes.json');
const { chatComplete } = require('../services/sarvam');

function clean(text = '') {
  return text
    .replace(/₹/g, 'Rs. ')
    .replace(/ï»¿/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

router.post('/', async (req, res) => {
  try {
    const { schemeSlugs, language } = req.body;
    const matched = schemes.filter((s) => schemeSlugs.includes(s.slug));

    // Summarize + clean each scheme individually — strips website junk,
    // condenses to only the essentials, and translates in one pass
    const summarized = await Promise.all(matched.map(async (s) => {
      const systemPrompt = `You are cleaning up messy scraped government scheme data for a printed report.
From the raw text given, extract and summarize ONLY the genuinely useful information. Ignore and DISCARD
any website UI text, FAQ sections, "sign in", "something went wrong", cookie/session messages, or navigation text.

Respond in ${language || 'en-IN'}, using ONLY this exact JSON structure, no markdown, no extra text:
{
  "eligibility": "2-3 short bullet points, each under 15 words, separated by | ",
  "benefits": "2-3 short bullet points, each under 15 words, separated by | ",
  "documents": "comma-separated short list of document names only",
  "howToApply": "3-4 short numbered steps, each under 15 words, separated by | "
}`;

      const raw = `Scheme name: ${s.name}
Eligibility (raw): ${clean(s.eligibility || '')}
Benefits (raw): ${clean(s.benefits || '')}
Documents (raw): ${clean(s.documents || '')}
Application steps (raw): ${clean(s.applicationSteps || '')}`;

      let parsed;
      try {
        const result = await chatComplete(systemPrompt, raw, { temperature: 0.2 });
        parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      } catch {
        parsed = {
          eligibility: clean(s.eligibility || '').slice(0, 200),
          benefits: clean(s.benefits || '').slice(0, 200),
          documents: clean(s.documents || '').slice(0, 200),
          howToApply: clean(s.applicationSteps || '').slice(0, 200)
        };
      }

      return { ...parsed, name: s.name, applicationLink: s.applicationLink };
    }));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=eligibility_report.pdf');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title block
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text('Yojana Mitra', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#555').text('Eligibility Report', { align: 'center' });
    doc.moveDown(1.5);
    doc.strokeColor('#ccc').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    summarized.forEach((s, i) => {
      // Scheme title
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${i + 1}. ${clean(s.name)}`);
      doc.moveDown(0.5);

      const section = (label, value) => {
        if (!value) return;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb').text(label);
        const points = value.split('|').map((p) => p.trim()).filter(Boolean);
        points.forEach((point) => {
          doc.fontSize(10).font('Helvetica').fillColor('#333').text(`•  ${point}`, { indent: 10 });
        });
        doc.moveDown(0.6);
      };

      section('Eligibility', s.eligibility);
      section('Benefits', s.benefits);

      if (s.documents) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb').text('Documents Required');
        doc.fontSize(10).font('Helvetica').fillColor('#333').text(s.documents, { indent: 10 });
        doc.moveDown(0.6);
      }

      section('How to Apply', s.howToApply);

      // Real clickable link
      if (s.applicationLink) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb')
          .text('Apply here →', { continued: false, underline: true, link: s.applicationLink });
      }

      doc.moveDown(1.2);

      if (i < summarized.length - 1) {
        doc.strokeColor('#eee').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);
      }

      if (doc.y > 680 && i < summarized.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
  } catch (err) {
    console.error('[report] Error:', err.message);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

module.exports = router;