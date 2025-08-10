const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// create room
router.post('/create', async (req, res) => {
  const { name, password, maxPlayers, leaderId } = req.body;
  const roomCode = (Math.random().toString(36).substr(2,8)).toUpperCase();
  const pwdHash = password ? await bcrypt.hash(password, 10) : null;
  const r = await db.query('INSERT INTO rooms (room_code, name, leader_id, password_hash, max_players) VALUES ($1,$2,$3,$4,$5) RETURNING *', [roomCode, name, leaderId, pwdHash, maxPlayers || 8]);
  res.json(r.rows[0]);
});

// get room by code
router.get('/by-code/:code', async (req, res) => {
  const r = await db.query('SELECT * FROM rooms WHERE room_code=$1', [req.params.code]);
  if (!r.rows.length) return res.status(404).json({ error: 'not found' });
  res.json(r.rows[0]);
});

module.exports = router;
