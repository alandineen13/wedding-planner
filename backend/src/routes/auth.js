const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../db/helpers');

function signToken(userId, email, weddingId) {
  return jwt.sign(
    { id: userId, email, weddingId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function formatUser(user, wedding) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    weddingDate: wedding?.wedding_date || null,
    partnerName: wedding?.partner_name || null,
    venueName: wedding?.venue_name || null,
  };
}

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'email, password and name are required' });
  }

  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rows.length) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [user] } = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING *',
      [email, passwordHash, name]
    );
    const { rows: [wedding] } = await client.query(
      'INSERT INTO weddings (user_id) VALUES ($1) RETURNING *',
      [user.id]
    );
    await client.query('COMMIT');

    res.status(201).json({
      token: signToken(user.id, user.email, wedding.id),
      user: formatUser(user, wedding),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const { rows: [wedding] } = await pool.query('SELECT * FROM weddings WHERE user_id=$1', [user.id]);
  res.json({
    token: signToken(user.id, user.email, wedding?.id),
    user: formatUser(user, wedding),
  });
}));

// GET /api/auth/me
router.get('/me', auth, asyncHandler(async (req, res) => {
  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { rows: [wedding] } = await pool.query('SELECT * FROM weddings WHERE user_id=$1', [user.id]);
  res.json(formatUser(user, wedding));
}));

// PUT /api/auth/me
router.put('/me', auth, asyncHandler(async (req, res) => {
  const { name, weddingDate, partnerName, venueName } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [user] } = await client.query(
      'UPDATE users SET name=$1 WHERE id=$2 RETURNING *',
      [name, req.user.id]
    );
    const { rows: [wedding] } = await client.query(
      `UPDATE weddings SET wedding_date=$1, partner_name=$2, venue_name=$3, updated_at=NOW()
       WHERE user_id=$4 RETURNING *`,
      [weddingDate || null, partnerName || null, venueName || null, req.user.id]
    );
    await client.query('COMMIT');
    res.json(formatUser(user, wedding));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

module.exports = router;
