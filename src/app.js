const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./controllers/auth.controller');
const profileRoutes = require('./controllers/profile.controller');
const roomRoutes = require('./controllers/room.controller');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(process.env.MEDIA_DIR || 'uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));
module.exports = app;
