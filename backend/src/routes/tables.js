const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { mapTable, asyncHandler } = require('../db/helpers');

const TABLE_WITH_GUESTS = `
  SELECT t.id, t.name, t.capacity, t.shape, t.position_x, t.position_y, t.notes,
    COALESCE(array_agg(sa.guest_id) FILTER (WHERE sa.guest_id IS NOT NULL), ARRAY[]::uuid[]) AS guest_ids
  FROM tables t
  LEFT JOIN seating_assignments sa ON sa.table_id = t.id
`;

// GET /api/tables
router.get('/', auth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `${TABLE_WITH_GUESTS} WHERE t.wedding_id=$1 GROUP BY t.id ORDER BY t.name`,
    [req.user.weddingId]
  );
  res.json(rows.map(mapTable));
}));

// POST /api/tables
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name, capacity, shape, positionX, positionY, notes } = req.body;
  if (!name || !capacity) return res.status(400).json({ message: 'name and capacity are required' });

  const { rows: [table] } = await pool.query(
    `INSERT INTO tables (wedding_id, name, capacity, shape, position_x, position_y, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, capacity, shape, position_x, position_y, notes`,
    [req.user.weddingId, name, capacity, shape || 'round', positionX || null, positionY || null, notes || null]
  );
  res.status(201).json({ ...mapTable(table), guestIds: [] });
}));

// PUT /api/tables/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { name, capacity, shape, positionX, positionY, notes } = req.body;
  const { rows: [table] } = await pool.query(
    `UPDATE tables SET name=$1, capacity=$2, shape=$3, position_x=$4, position_y=$5, notes=$6
     WHERE id=$7 AND wedding_id=$8
     RETURNING id, name, capacity, shape, position_x, position_y, notes`,
    [name, capacity, shape || 'round', positionX || null, positionY || null, notes || null,
     req.params.id, req.user.weddingId]
  );
  if (!table) return res.status(404).json({ message: 'Table not found' });

  const { rows } = await pool.query(
    `${TABLE_WITH_GUESTS} WHERE t.id=$1 GROUP BY t.id`,
    [req.params.id]
  );
  res.json(mapTable(rows[0]));
}));

// DELETE /api/tables/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tables WHERE id=$1 AND wedding_id=$2',
    [req.params.id, req.user.weddingId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Table not found' });
  res.status(204).send();
}));

// POST /api/tables/:id/assign-guest
router.post('/:id/assign-guest', auth, asyncHandler(async (req, res) => {
  const { guestId } = req.body;
  if (!guestId) return res.status(400).json({ message: 'guestId is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [tableRow] } = await client.query(
      `SELECT t.capacity, COUNT(sa.guest_id)::int AS occupied
       FROM tables t
       LEFT JOIN seating_assignments sa ON sa.table_id = t.id
       WHERE t.id=$1 AND t.wedding_id=$2
       GROUP BY t.capacity`,
      [req.params.id, req.user.weddingId]
    );
    if (!tableRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Table not found' });
    }
    if (tableRow.occupied >= tableRow.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Table is at full capacity' });
    }

    // Remove from any current table (unique index ensures one table per guest)
    await client.query('DELETE FROM seating_assignments WHERE guest_id=$1', [guestId]);
    await client.query(
      'INSERT INTO seating_assignments (table_id, guest_id) VALUES ($1,$2)',
      [req.params.id, guestId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    `${TABLE_WITH_GUESTS} WHERE t.id=$1 GROUP BY t.id`,
    [req.params.id]
  );
  res.json(mapTable(rows[0]));
}));

// DELETE /api/tables/:id/guests/:guestId — unassign without deleting
router.delete('/:id/guests/:guestId', auth, asyncHandler(async (req, res) => {
  await pool.query(
    'DELETE FROM seating_assignments WHERE table_id=$1 AND guest_id=$2',
    [req.params.id, req.params.guestId]
  );
  const { rows } = await pool.query(
    `${TABLE_WITH_GUESTS} WHERE t.id=$1 AND t.wedding_id=$2 GROUP BY t.id`,
    [req.params.id, req.user.weddingId]
  );
  if (!rows.length) return res.status(404).json({ message: 'Table not found' });
  res.json(mapTable(rows[0]));
}));

module.exports = router;
