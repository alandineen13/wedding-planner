const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../db/helpers');

function generateCode() {
  return crypto.randomBytes(5).toString('hex'); // 10-char hex code
}

// Static routes must be declared before /:code to avoid being caught by the param matcher

// GET /api/wedding-rsvp/mine — returns the couple's own RSVP code (auth required)
router.get('/mine', auth, asyncHandler(async (req, res) => {
  const { rows: [w] } = await pool.query(
    'SELECT id, rsvp_code FROM weddings WHERE id=$1',
    [req.user.weddingId]
  );
  if (!w) return res.status(404).json({ message: 'Wedding not found' });

  if (!w.rsvp_code) {
    const code = generateCode();
    await pool.query('UPDATE weddings SET rsvp_code=$1 WHERE id=$2', [code, w.id]);
    return res.json({ code });
  }

  res.json({ code: w.rsvp_code });
}));

// POST /api/wedding-rsvp/mine/regenerate — creates a fresh code (auth required)
router.post('/mine/regenerate', auth, asyncHandler(async (req, res) => {
  const code = generateCode();
  const { rowCount } = await pool.query(
    'UPDATE weddings SET rsvp_code=$1 WHERE id=$2',
    [code, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Wedding not found' });
  res.json({ code });
}));

// GET /api/wedding-rsvp/:code — returns wedding display info for the public form (no auth)
router.get('/:code', asyncHandler(async (req, res) => {
  const { rows: [w] } = await pool.query(
    `SELECT w.partner_name, w.wedding_date, w.venue_name, u.name AS user_name
     FROM weddings w
     JOIN users u ON u.id = w.user_id
     WHERE w.rsvp_code = $1`,
    [req.params.code]
  );
  if (!w) return res.status(404).json({ message: 'Invalid RSVP link' });

  res.json({
    userName: w.user_name,
    partnerName: w.partner_name,
    weddingDate: w.wedding_date,
    venueName: w.venue_name,
  });
}));

// POST /api/wedding-rsvp/:code — guest self-submits an RSVP, creates a guest record (no auth)
router.post('/:code', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, rsvpStatus, dietaryRequirements, message } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First name and last name are required' });
  }

  const { rows: [w] } = await pool.query(
    'SELECT id FROM weddings WHERE rsvp_code=$1',
    [req.params.code]
  );
  if (!w) return res.status(404).json({ message: 'Invalid RSVP link' });

  await pool.query(
    `INSERT INTO guests (
       wedding_id, first_name, last_name, email,
       side, invite_status, rsvp_status,
       dietary_requirements, message, rsvp_submitted_at
     ) VALUES ($1, $2, $3, $4, 'both', 'not_sent', $5, $6, $7, NOW())`,
    [
      w.id, firstName, lastName, email || null,
      rsvpStatus || 'confirmed',
      dietaryRequirements || null,
      message || null,
    ]
  );

  res.status(201).json({ message: 'RSVP submitted successfully' });
}));

module.exports = router;
