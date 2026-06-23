const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { mapRow, asyncHandler } = require('../db/helpers');

// GET /api/suppliers
router.get('/', auth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM suppliers WHERE wedding_id=$1 ORDER BY name',
    [req.user.weddingId]
  );
  res.json(rows.map(mapRow));
}));

// POST /api/suppliers
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name, category, contactName, email, phone, website, address,
          contractStatus, contractUrl, totalCost, depositAmount,
          depositPaid, balanceDue, balanceDueDate, notes } = req.body;
  if (!name || !category) return res.status(400).json({ message: 'name and category are required' });

  const { rows: [supplier] } = await pool.query(
    `INSERT INTO suppliers
       (wedding_id, name, category, contact_name, email, phone, website, address,
        contract_status, contract_url, total_cost, deposit_amount, deposit_paid,
        balance_due, balance_due_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      req.user.weddingId, name, category, contactName || null, email || null,
      phone || null, website || null, address || null,
      contractStatus || 'none', contractUrl || null, totalCost || null,
      depositAmount || null, depositPaid ?? false, balanceDue || null,
      balanceDueDate || null, notes || null,
    ]
  );
  res.status(201).json(mapRow(supplier));
}));

// GET /api/suppliers/:id
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const { rows: [supplier] } = await pool.query(
    'SELECT * FROM suppliers WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(mapRow(supplier));
}));

// PUT /api/suppliers/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { name, category, contactName, email, phone, website, address,
          contractStatus, contractUrl, totalCost, depositAmount,
          depositPaid, balanceDue, balanceDueDate, notes } = req.body;

  const { rows: [supplier] } = await pool.query(
    `UPDATE suppliers SET
       name=$1, category=$2, contact_name=$3, email=$4, phone=$5, website=$6,
       address=$7, contract_status=$8, contract_url=$9, total_cost=$10,
       deposit_amount=$11, deposit_paid=$12, balance_due=$13,
       balance_due_date=$14, notes=$15
     WHERE id=$16 AND wedding_id=$17
     RETURNING *`,
    [
      name, category, contactName || null, email || null, phone || null,
      website || null, address || null, contractStatus || 'none',
      contractUrl || null, totalCost || null, depositAmount || null,
      depositPaid ?? false, balanceDue || null, balanceDueDate || null,
      notes || null, req.params.id, req.user.weddingId,
    ]
  );
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(mapRow(supplier));
}));

// DELETE /api/suppliers/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM suppliers WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Supplier not found' });
  res.status(204).send();
}));

module.exports = router;
