// server/routes/schemes.js  — new route to fetch full detail on click
const express = require('express');
const router = express.Router();
const schemes = require('../data/schemes.json');

router.get('/:slug', (req, res) => {
  const scheme = schemes.find((s) => s.slug === req.params.slug);
  if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
  res.json(scheme);
});

module.exports = router;