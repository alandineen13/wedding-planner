const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

const list = uid => store.guests[uid] ?? [];

// GET /api/guests
router.get('/', auth, (req, res) => res.json(list(req.user.id)));

// POST /api/guests
router.post('/', auth, (req, res) => {
  const uid = req.user.id;
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ message: 'firstName and lastName are required' });

  const now = new Date().toISOString();
  const guest = {
    ...req.body,
    id: crypto.randomUUID(),
    rsvpToken: crypto.randomUUID(),
    rsvpStatus: req.body.rsvpStatus ?? 'pending',
    inviteStatus: req.body.inviteStatus ?? 'not_sent',
    plusOneAllowed: req.body.plusOneAllowed ?? false,
    createdAt: now,
    updatedAt: now,
  };
  store.guests[uid].push(guest);
  res.status(201).json(guest);
});

// GET /api/guests/:id
router.get('/:id', auth, (req, res) => {
  const guest = list(req.user.id).find(g => g.id === req.params.id);
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(guest);
});

// PUT /api/guests/:id
router.put('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.guests[uid].findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Guest not found' });
  store.guests[uid][idx] = {
    ...store.guests[uid][idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  res.json(store.guests[uid][idx]);
});

// DELETE /api/guests/:id
router.delete('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const before = store.guests[uid].length;
  store.guests[uid] = store.guests[uid].filter(g => g.id !== req.params.id);
  if (store.guests[uid].length === before) return res.status(404).json({ message: 'Guest not found' });
  res.status(204).send();
});

module.exports = router;
