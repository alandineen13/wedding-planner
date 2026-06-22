const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

const list = uid => store.tasks[uid] ?? [];

// GET /api/tasks
router.get('/', auth, (req, res) => res.json(list(req.user.id)));

// POST /api/tasks
router.post('/', auth, (req, res) => {
  const uid = req.user.id;
  const { title, category } = req.body;
  if (!title || !category) return res.status(400).json({ message: 'title and category are required' });
  const now = new Date().toISOString();
  const task = {
    ...req.body,
    id: crypto.randomUUID(),
    status: req.body.status ?? 'todo',
    priority: req.body.priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
  };
  store.tasks[uid].push(task);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const idx = store.tasks[uid].findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });
  const existing = store.tasks[uid][idx];
  const updated = {
    ...existing,
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  if (req.body.status === 'completed' && !existing.completedAt) {
    updated.completedAt = new Date().toISOString();
  }
  store.tasks[uid][idx] = updated;
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  const uid = req.user.id;
  const before = store.tasks[uid].length;
  store.tasks[uid] = store.tasks[uid].filter(t => t.id !== req.params.id);
  if (store.tasks[uid].length === before) return res.status(404).json({ message: 'Task not found' });
  res.status(204).send();
});

module.exports = router;
