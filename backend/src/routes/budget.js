const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

const items = uid => store.budgetItems[uid] ?? [];

// GET /api/budget
router.get('/', auth, (req, res) => {
  const uid = req.user.id;
  const { totalBudget = 0 } = store.budgetSettings[uid] ?? {};
  res.json({ totalBudget, items: items(uid) });
});

// PUT /api/budget/settings — update the total budget cap
// Must be defined before /:id so "settings" is not treated as an id
router.put('/settings', auth, (req, res) => {
  const uid = req.user.id;
  const { totalBudget } = req.body;
  if (typeof totalBudget !== 'number' || totalBudget < 0) {
    return res.status(400).json({ message: 'totalBudget must be a non-negative number' });
  }
  store.budgetSettings[uid] = { totalBudget };
  res.json({ totalBudget });
});

// POST /api/budget
router.post('/', auth, (req, res) => {
  const uid = req.user.id;
  const { name, category, estimatedCost } = req.body;
  if (!name || !category || estimatedCost == null) {
    return res.status(400).json({ message: 'name, category and estimatedCost are required' });
  }
  const item = {
    ...req.body,
    id: crypto.randomUUID(),
    paymentStatus: req.body.paymentStatus ?? 'unpaid',
    createdAt: new Date().toISOString(),
  };
  store.budgetItems[uid].push(item);
  res.status(201).json(item);
});

// PUT /api/budget/:id
router.put('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.budgetItems[uid].findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Budget item not found' });
  store.budgetItems[uid][idx] = { ...store.budgetItems[uid][idx], ...req.body, id: req.params.id };
  res.json(store.budgetItems[uid][idx]);
});

// DELETE /api/budget/:id
router.delete('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const before = store.budgetItems[uid].length;
  store.budgetItems[uid] = store.budgetItems[uid].filter(i => i.id !== req.params.id);
  if (store.budgetItems[uid].length === before) return res.status(404).json({ message: 'Budget item not found' });
  res.status(204).send();
});

module.exports = router;
