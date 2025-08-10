const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !password || !username) return res.status(400).json({ error: 'Missing' });
  const passHash = await bcrypt.hash(password, 10);
  try {
    const r = await db.query('INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username', [email, username, passHash]);
    await db.query('INSERT INTO profiles (user_id, display_name) VALUES ($1,$2)', [r.rows[0].id, username]);
    const token = jwt.sign({ id: r.rows[0].id, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const r = await db.query('SELECT id, email, username, password_hash FROM users WHERE email=$1', [email]);
  if (!r.rows.length) return res.status(401).json({ error: 'Invalid' });
  const u = r.rows[0];
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid' });
  const token = jwt.sign({ id: u.id, username: u.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: u.id, email: u.email, username: u.username } });
});

module.exports = router;
