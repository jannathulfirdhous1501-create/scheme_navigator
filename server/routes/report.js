// server/routes/report.js
const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();
const schemes = require('../data/schemes.json');
const { chatComplete } = require('../services/sarvam');

router.post('/', async (req, res) => {
  try {
    const { schemeSlugs, language } = req.body;
    const matched = schemes.filter((s) => schemeSlugs.includes(s.slug));

    const translated = await chatComplete(
      `Translate the following scheme details into ${language || 'en-IN'}. Return ONLY a JSON array matching the input structure, same field names, translated values.`,
      JSON.stringify(matched.map(s => ({ name: s.name, description: s.description, benefits: s.benefits, documents: s.documents, applicationSteps: s.applicationSteps })))
    );

    let content;
    try { content = JSON.parse(translated.replace(/```json|```/g, '').trim()); }
    catch { content = matched; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=eligibility_report.pdf');

    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(18).text('Yojana Mitra - Eligibility Report', { align: 'center' });
    doc.moveDown();

    content.forEach((s, i) => {
      doc.fontSize(14).text(`${i + 1}. ${s.name}`);
      doc.fontSize(10).text(`${s.description || ''}`);
      doc.text(`Benefits: ${s.benefits || ''}`);
      doc.text(`Documents: ${s.documents || ''}`);
      doc.text(`How to apply: ${s.applicationSteps || ''}`);
      const original = matched[i];
      if (original?.applicationLink) doc.text(`Link: ${original.applicationLink}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

module.exports = router;