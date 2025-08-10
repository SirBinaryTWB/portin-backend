const { Server } = require('socket.io');
const db = require('../db');
const jwt = require('jsonwebtoken');

const roomsState = new Map();

function attach(server) {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods:['GET','POST'], credentials:true }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
    } catch (e) {}
    next();
  });

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('join-room', async ({ roomCode }, cb) => {
      try {
        const r = await db.query('SELECT * FROM rooms WHERE room_code=$1', [roomCode]);
        if (!r.rows.length) return cb({ error: 'Room not found' });
        const room = r.rows[0];
        socket.join(room.id);
        socket.roomId = room.id;
        if (!roomsState.has(room.id)) roomsState.set(room.id, { members: {}, gameState: null });
        const state = roomsState.get(room.id);
        state.members[socket.id] = { socketId: socket.id, user: socket.user || { username: 'Guest' }, speaking:false, muted:false };
        io.to(room.id).emit('room:members', Object.values(state.members).map(m=>m.user));
        cb({ ok:true, roomId: room.id });
      } catch(err) {
        console.error(err);
        cb({ error: 'server error' });
      }
    });

    socket.on('room:message', async (payload) => {
      try {
        if (!socket.roomId) return;
        await db.query('INSERT INTO messages (room_id, user_id, type, payload) VALUES ($1,$2,$3,$4)', [socket.roomId, socket.user?.id || null, payload.type || 'text', payload]);
        io.to(socket.roomId).emit('room:message', { ...payload, user: socket.user ? { id: socket.user.id, username: socket.user.username } : { username:'Guest' }, created_at: new Date() });
      } catch(err){ console.error(err); }
    });

    socket.on('game:event', (evt) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit('game:event', evt);
      if (evt.type === 'state:update') {
        const s = roomsState.get(socket.roomId) || {};
        s.gameState = evt.state;
        roomsState.set(socket.roomId, s);
        db.query('INSERT INTO game_states (room_id, game_type, state) VALUES ($1,$2,$3)', [socket.roomId, evt.gameType, evt.state]).catch(()=>{});
      }
    });

    socket.on('webrtc:signal', ({ toSocketId, data }) => {
      io.to(toSocketId).emit('webrtc:signal', { from: socket.id, data });
    });

    socket.on('voice:speaking', ({ speaking }) => {
      if (!socket.roomId) return;
      const state = roomsState.get(socket.roomId);
      if (!state) return;
      if (state.members[socket.id]) {
        state.members[socket.id].speaking = speaking;
        io.to(socket.roomId).emit('voice:presence', Object.values(state.members).map(m => ({ username: m.user.username, speaking: m.speaking })));
      }
    });

    socket.on('disconnect', () => {
      if (socket.roomId) {
        const s = roomsState.get(socket.roomId);
        if (s) { delete s.members[socket.id]; io.to(socket.roomId).emit('room:members', Object.values(s.members).map(m=>m.user)); }
      }
      console.log('disconnected', socket.id);
    });
  });

  return { io };
}

module.exports = { attach };
