const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { mapGuest, asyncHandler } = require('../db/helpers');

const GUEST_COLS = `
  id, first_name, last_name, email, phone, address, side, "group",
  invite_status, rsvp_status, dietary_requirements,
  plus_one_allowed, plus_one_name, plus_one_dietary,
  rsvp_token, rsvp_submitted_at, accommodation_required, transport_required,
  song_request, message, notes, created_at, updated_at
`;

// GET /api/guests
router.get('/', auth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${GUEST_COLS} FROM guests WHERE wedding_id=$1 ORDER BY last_name, first_name`,
    [req.user.weddingId]
  );
  res.json(rows.map(mapGuest));
}));

// POST /api/guests
router.post('/', auth, asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, address, side, group,
          inviteStatus, rsvpStatus, dietaryRequirements, plusOneAllowed,
          plusOne, accommodationRequired, transportRequired, notes } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'firstName and lastName are required' });
  }

  const { rows: [guest] } = await pool.query(
    `INSERT INTO guests (
       wedding_id, first_name, last_name, email, phone, address, side, "group",
       invite_status, rsvp_status, dietary_requirements, plus_one_allowed,
       plus_one_name, plus_one_dietary, accommodation_required, transport_required, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING ${GUEST_COLS}`,
    [
      req.user.weddingId, firstName, lastName, email || null, phone || null,
      address || null, side, group || null, inviteStatus || 'not_sent',
      rsvpStatus || 'pending', dietaryRequirements || null, plusOneAllowed ?? false,
      plusOne?.name || null, plusOne?.dietaryRequirements || null,
      accommodationRequired ?? false, transportRequired ?? false, notes || null,
    ]
  );
  res.status(201).json(mapGuest(guest));
}));

// GET /api/guests/:id
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const { rows: [guest] } = await pool.query(
    `SELECT ${GUEST_COLS} FROM guests WHERE id=$1 AND wedding_id=$2`,
    [req.params.id, req.user.weddingId]
  );
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(mapGuest(guest));
}));

// PUT /api/guests/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, address, side, group,
          inviteStatus, rsvpStatus, dietaryRequirements, plusOneAllowed,
          plusOne, accommodationRequired, transportRequired, notes } = req.body;

  const { rows: [guest] } = await pool.query(
    `UPDATE guests SET
       first_name=$1, last_name=$2, email=$3, phone=$4, address=$5,
       side=$6, "group"=$7, invite_status=$8, rsvp_status=$9,
       dietary_requirements=$10, plus_one_allowed=$11,
       plus_one_name=$12, plus_one_dietary=$13,
       accommodation_required=$14, transport_required=$15,
       notes=$16, updated_at=NOW()
     WHERE id=$17 AND wedding_id=$18
     RETURNING ${GUEST_COLS}`,
    [
      firstName, lastName, email || null, phone || null, address || null,
      side, group || null, inviteStatus, rsvpStatus,
      dietaryRequirements || null, plusOneAllowed ?? false,
      plusOne?.name || null, plusOne?.dietaryRequirements || null,
      accommodationRequired ?? false, transportRequired ?? false,
      notes || null, req.params.id, req.user.weddingId,
    ]
  );
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(mapGuest(guest));
}));

// DELETE /api/guests/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM guests WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Guest not found' });
  res.status(204).send();
}));

module.exports = router;
