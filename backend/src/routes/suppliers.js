const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

const list = uid => store.suppliers[uid] ?? [];

// GET /api/suppliers
router.get('/', auth, (req, res) => res.json(list(req.user.id)));

// POST /api/suppliers
router.post('/', auth, (req, res) => {
  const uid = req.user.id;
  const { name, category } = req.body;
  if (!name || !category) return res.status(400).json({ message: 'name and category are required' });
  const supplier = {
    ...req.body,
    id: crypto.randomUUID(),
    contractStatus: req.body.contractStatus ?? 'none',
    createdAt: new Date().toISOString(),
  };
  store.suppliers[uid].push(supplier);
  res.status(201).json(supplier);
});

// GET /api/suppliers/:id
router.get('/:id', auth, (req, res) => {
  const supplier = list(req.user.id).find(s => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(supplier);
});

// PUT /api/suppliers/:id
router.put('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.suppliers[uid].findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Supplier not found' });
  store.suppliers[uid][idx] = { ...store.suppliers[uid][idx], ...req.body, id: req.params.id };
  res.json(store.suppliers[uid][idx]);
});

// DELETE /api/suppliers/:id
router.delete('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const before = store.suppliers[uid].length;
  store.suppliers[uid] = store.suppliers[uid].filter(s => s.id !== req.params.id);
  if (store.suppliers[uid].length === before) return res.status(404).json({ message: 'Supplier not found' });
  res.status(204).send();
});

module.exports = router;
