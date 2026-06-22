const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { store, initUser } = require('../db/store');
const auth = require('../middleware/auth');

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'email, password and name are required' });
  }
  if (store.users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), email, passwordHash, name };
  store.users.push(user);
  initUser(user.id);

  res.status(201).json({ token: signToken(user), user: safeUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = store.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ token: signToken(user), user: safeUser(user) });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = store.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(safeUser(user));
});

// PUT /api/auth/me — update profile (name, wedding date, partner name, venue)
router.put('/me', auth, (req, res) => {
  const idx = store.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  const { name, weddingDate, partnerName, venueName } = req.body;
  store.users[idx] = { ...store.users[idx], name, weddingDate, partnerName, venueName };
  res.json(safeUser(store.users[idx]));
});

module.exports = router;
