const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const shortid = require('shortid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve static client
app.use(express.static('public'));

// Room storage in-memory (for prototype)
const rooms = {}; // code -> { hostSocketId, players: [{id, name}], maxPlayers }

const MAX_PLAYERS = 10;

function genCode() {
  // shortid generates short unique ids; replace with your own generator if desired
  return (shortid.generate()).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('create-room', ({ name }, cb) => {
    const code = genCode();
    rooms[code] = {
      hostSocketId: socket.id,
      players: [{ id: socket.id, name: name || 'Host' }],
      maxPlayers: MAX_PLAYERS,
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name || 'Host';
    console.log(`Room ${code} created by ${socket.id}`);
    cb && cb({ ok: true, code, room: rooms[code] });
    io.to(code).emit('room-update', rooms[code]);
  });

  socket.on('join-room', ({ code, name }, cb) => {
    code = (code || '').toString().toUpperCase();
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.players.length >= room.maxPlayers) return cb && cb({ ok: false, error: 'Room full' });

    room.players.push({ id: socket.id, name: name || `Player-${room.players.length + 1}` });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name || `Player-${room.players.length}`;
    console.log(`${socket.id} joined room ${code}`);
    cb && cb({ ok: true, code, room });
    io.to(code).emit('room-update', room);
  });

  socket.on('start-game', (cb) => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return cb && cb({ ok: false, error: 'No room' });
    if (rooms[code].hostSocketId !== socket.id) return cb && cb({ ok: false, error: 'Only host can start' });

    io.to(code).emit('game-start', { msg: 'Game started!' });
    cb && cb({ ok: true });
  });

  socket.on('game-action', (payload) => {
    const code = socket.data.roomCode;
    if (!code) return;
    // Broadcast to other players in the room
    socket.to(code).emit('game-action', { from: socket.id, payload });
  });

  socket.on('leave-room', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    leaveRoom(socket, code);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (code) leaveRoom(socket, code);
    console.log('socket disconnected', socket.id);
  });
});

function leaveRoom(socket, code) {
  const room = rooms[code];
  if (!room) return;
  room.players = room.players.filter(p => p.id !== socket.id);
  socket.leave(code);
  if (room.hostSocketId === socket.id) {
    // If host left, pick a new host (first player) or close room
    if (room.players.length > 0) {
      room.hostSocketId = room.players[0].id;
      io.to(code).emit('host-changed', { newHost: room.hostSocketId });
    } else {
      // remove empty room
      delete rooms[code];
      console.log(`Room ${code} deleted (empty)`);
      return;
    }
  }
  io.to(code).emit('room-update', room);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));