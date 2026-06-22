const router = require('express').Router();
const { store } = require('../db/store');

function findByToken(token) {
  for (const uid of Object.keys(store.guests)) {
    const idx = store.guests[uid].findIndex(g => g.rsvpToken === token);
    if (idx !== -1) return { uid, idx, guest: store.guests[uid][idx] };
  }
  return null;
}

// GET /api/rsvp/:token — public, no auth required
router.get('/:token', (req, res) => {
  const found = findByToken(req.params.token);
  if (!found) return res.status(404).json({ message: 'Invalid RSVP link' });
  const { firstName, lastName, rsvpStatus, dietaryRequirements, plusOneAllowed, plusOne, songRequest, message } = found.guest;
  res.json({ firstName, lastName, rsvpStatus, dietaryRequirements, plusOneAllowed, plusOne, songRequest, message });
});

// POST /api/rsvp/:token — public, no auth required
router.post('/:token', (req, res) => {
  const found = findByToken(req.params.token);
  if (!found) return res.status(404).json({ message: 'Invalid RSVP link' });

  const { uid, idx, guest } = found;
  const { rsvpStatus, dietaryRequirements, songRequest, message, plusOne } = req.body;

  store.guests[uid][idx] = {
    ...guest,
    rsvpStatus: rsvpStatus ?? guest.rsvpStatus,
    dietaryRequirements: dietaryRequirements ?? guest.dietaryRequirements,
    songRequest: songRequest ?? guest.songRequest,
    message: message ?? guest.message,
    plusOne: guest.plusOneAllowed ? (plusOne ?? guest.plusOne) : guest.plusOne,
    rsvpSubmittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  res.json({ message: 'RSVP submitted successfully' });
});

module.exports = router;
