const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { mapRow, asyncHandler } = require('../db/helpers');

// GET /api/tasks
router.get('/', auth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE wedding_id=$1 ORDER BY due_date NULLS LAST, priority DESC',
    [req.user.weddingId]
  );
  res.json(rows.map(mapRow));
}));

// POST /api/tasks
router.post('/', auth, asyncHandler(async (req, res) => {
  const { title, description, category, status, priority,
          dueDate, assignedTo, supplierId, notes } = req.body;
  if (!title || !category) return res.status(400).json({ message: 'title and category are required' });

  const { rows: [task] } = await pool.query(
    `INSERT INTO tasks
       (wedding_id, title, description, category, status, priority,
        due_date, assigned_to, supplier_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      req.user.weddingId, title, description || null, category,
      status || 'todo', priority || 'medium',
      dueDate || null, assignedTo || null, supplierId || null, notes || null,
    ]
  );
  res.status(201).json(mapRow(task));
}));

// PUT /api/tasks/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { title, description, category, status, priority,
          dueDate, assignedTo, supplierId, notes } = req.body;

  const { rows: [task] } = await pool.query(
    `UPDATE tasks SET
       title=$1, description=$2, category=$3, status=$4, priority=$5,
       due_date=$6, assigned_to=$7, supplier_id=$8, notes=$9,
       completed_at = CASE WHEN $4='completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
       updated_at = NOW()
     WHERE id=$10 AND wedding_id=$11
     RETURNING *`,
    [
      title, description || null, category, status, priority,
      dueDate || null, assignedTo || null, supplierId || null, notes || null,
      req.params.id, req.user.weddingId,
    ]
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(mapRow(task));
}));

// DELETE /api/tasks/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Task not found' });
  res.status(204).send();
}));

module.exports = router;
