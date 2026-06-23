const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { mapRow, asyncHandler } = require('../db/helpers');

// GET /api/budget
router.get('/', auth, asyncHandler(async (req, res) => {
  const [wedRes, itemsRes] = await Promise.all([
    pool.query('SELECT total_budget FROM weddings WHERE id=$1', [req.user.weddingId]),
    pool.query('SELECT * FROM budget_items WHERE wedding_id=$1 ORDER BY created_at', [req.user.weddingId]),
  ]);
  res.json({
    totalBudget: wedRes.rows[0]?.total_budget ?? 0,
    items: itemsRes.rows.map(mapRow),
  });
}));

// PUT /api/budget/settings — must be before /:id
router.put('/settings', auth, asyncHandler(async (req, res) => {
  const { totalBudget } = req.body;
  if (typeof totalBudget !== 'number' || totalBudget < 0) {
    return res.status(400).json({ message: 'totalBudget must be a non-negative number' });
  }
  await pool.query(
    'UPDATE weddings SET total_budget=$1, updated_at=NOW() WHERE id=$2',
    [totalBudget, req.user.weddingId]
  );
  res.json({ totalBudget });
}));

// POST /api/budget
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name, category, estimatedCost, actualCost, depositAmount,
          depositPaid, paymentStatus, supplierId, notes, dueDate } = req.body;
  if (!name || !category || estimatedCost == null) {
    return res.status(400).json({ message: 'name, category and estimatedCost are required' });
  }
  const { rows: [item] } = await pool.query(
    `INSERT INTO budget_items
       (wedding_id, name, category, estimated_cost, actual_cost, deposit_amount,
        deposit_paid, payment_status, supplier_id, notes, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      req.user.weddingId, name, category, estimatedCost, actualCost || null,
      depositAmount || null, depositPaid ?? false, paymentStatus || 'unpaid',
      supplierId || null, notes || null, dueDate || null,
    ]
  );
  res.status(201).json(mapRow(item));
}));

// PUT /api/budget/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { name, category, estimatedCost, actualCost, depositAmount,
          depositPaid, paymentStatus, supplierId, notes, dueDate } = req.body;
  const { rows: [item] } = await pool.query(
    `UPDATE budget_items SET
       name=$1, category=$2, estimated_cost=$3, actual_cost=$4,
       deposit_amount=$5, deposit_paid=$6, payment_status=$7,
       supplier_id=$8, notes=$9, due_date=$10
     WHERE id=$11 AND wedding_id=$12
     RETURNING *`,
    [
      name, category, estimatedCost, actualCost || null,
      depositAmount || null, depositPaid ?? false, paymentStatus,
      supplierId || null, notes || null, dueDate || null,
      req.params.id, req.user.weddingId,
    ]
  );
  if (!item) return res.status(404).json({ message: 'Budget item not found' });
  res.json(mapRow(item));
}));

// DELETE /api/budget/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM budget_items WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Budget item not found' });
  res.status(204).send();
}));

module.exports = router;
