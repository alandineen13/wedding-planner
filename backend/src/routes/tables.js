const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

const list = uid => store.tables[uid] ?? [];

// GET /api/tables
router.get('/', auth, (req, res) => res.json(list(req.user.id)));

// POST /api/tables
router.post('/', auth, (req, res) => {
  const uid = req.user.id;
  const { name, capacity } = req.body;
  if (!name || !capacity) return res.status(400).json({ message: 'name and capacity are required' });
  const table = {
    ...req.body,
    id: crypto.randomUUID(),
    guestIds: req.body.guestIds ?? [],
    shape: req.body.shape ?? 'round',
  };
  store.tables[uid].push(table);
  res.status(201).json(table);
});

// PUT /api/tables/:id
router.put('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.tables[uid].findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Table not found' });
  store.tables[uid][idx] = { ...store.tables[uid][idx], ...req.body, id: req.params.id };
  res.json(store.tables[uid][idx]);
});

// DELETE /api/tables/:id
router.delete('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const before = store.tables[uid].length;
  store.tables[uid] = store.tables[uid].filter(t => t.id !== req.params.id);
  if (store.tables[uid].length === before) return res.status(404).json({ message: 'Table not found' });
  res.status(204).send();
});

// POST /api/tables/:id/assign-guest — moves guest to this table, removes from any other
router.post('/:id/assign-guest', auth, (req, res) => {
  const uid = req.user.id;
  const { guestId } = req.body;
  if (!guestId) return res.status(400).json({ message: 'guestId is required' });

  const target = store.tables[uid].find(t => t.id === req.params.id);
  if (!target) return res.status(404).json({ message: 'Table not found' });
  if (target.guestIds.length >= target.capacity && !target.guestIds.includes(guestId)) {
    return res.status(409).json({ message: 'Table is at full capacity' });
  }

  store.tables[uid] = store.tables[uid].map(t => {
    const without = t.guestIds.filter(id => id !== guestId);
    return t.id === req.params.id ? { ...t, guestIds: [...without, guestId] } : { ...t, guestIds: without };
  });

  res.json(store.tables[uid].find(t => t.id === req.params.id));
});

// DELETE /api/tables/:id/guests/:guestId — unassign a guest without deleting them
router.delete('/:id/guests/:guestId', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.tables[uid].findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Table not found' });
  store.tables[uid][idx] = {
    ...store.tables[uid][idx],
    guestIds: store.tables[uid][idx].guestIds.filter(id => id !== req.params.guestId),
  };
  res.json(store.tables[uid][idx]);
});

module.exports = router;
