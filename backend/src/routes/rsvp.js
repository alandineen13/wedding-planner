const router = require('express').Router();
const pool = require('../db/client');
const { asyncHandler } = require('../db/helpers');

// GET /api/rsvp/:token — public, no auth
router.get('/:token', asyncHandler(async (req, res) => {
  const { rows: [guest] } = await pool.query(
    `SELECT first_name, last_name, rsvp_status, dietary_requirements,
            plus_one_allowed, plus_one_name, plus_one_dietary, song_request, message
     FROM guests WHERE rsvp_token=$1`,
    [req.params.token]
  );
  if (!guest) return res.status(404).json({ message: 'Invalid RSVP link' });

  res.json({
    firstName: guest.first_name,
    lastName: guest.last_name,
    rsvpStatus: guest.rsvp_status,
    dietaryRequirements: guest.dietary_requirements,
    plusOneAllowed: guest.plus_one_allowed,
    plusOne: guest.plus_one_name ? { name: guest.plus_one_name, dietaryRequirements: guest.plus_one_dietary } : null,
    songRequest: guest.song_request,
    message: guest.message,
  });
}));

// POST /api/rsvp/:token — public, no auth
router.post('/:token', asyncHandler(async (req, res) => {
  const { rsvpStatus, dietaryRequirements, songRequest, message, plusOne } = req.body;

  const { rowCount } = await pool.query(
    `UPDATE guests SET
       rsvp_status      = COALESCE($1, rsvp_status),
       dietary_requirements = COALESCE($2, dietary_requirements),
       song_request     = COALESCE($3, song_request),
       message          = COALESCE($4, message),
       plus_one_name    = CASE WHEN plus_one_allowed THEN COALESCE($5, plus_one_name) ELSE plus_one_name END,
       plus_one_dietary = CASE WHEN plus_one_allowed THEN COALESCE($6, plus_one_dietary) ELSE plus_one_dietary END,
       rsvp_submitted_at = NOW(),
       updated_at        = NOW()
     WHERE rsvp_token=$7`,
    [
      rsvpStatus || null, dietaryRequirements || null,
      songRequest || null, message || null,
      plusOne?.name || null, plusOne?.dietaryRequirements || null,
      req.params.token,
    ]
  );
  if (!rowCount) return res.status(404).json({ message: 'Invalid RSVP link' });
  res.json({ message: 'RSVP submitted successfully' });
}));

module.exports = router;
