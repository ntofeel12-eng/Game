const socket = io();
const nameInput = document.getElementById('name');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const joinCodeInput = document.getElementById('joinCode');
const roomInfo = document.getElementById('roomInfo');
const roomCodeEl = document.getElementById('roomCode');
const playersEl = document.getElementById('players');
const hostIdEl = document.getElementById('hostId');
const startBtn = document.getElementById('startBtn');
const leaveBtn = document.getElementById('leaveBtn');
const logEl = document.getElementById('log');
const actionText = document.getElementById('actionText');
const sendActionBtn = document.getElementById('sendAction');

function log(msg) {
  logEl.textContent += msg + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

createBtn.onclick = () => {
  socket.emit('create-room', { name: nameInput.value }, (res) => {
    if (res && res.ok) {
      showRoom(res.code, res.room);
      log('Created room: ' + res.code);
    } else {
      log('Create failed');
    }
  });
};

joinBtn.onclick = () => {
  const code = joinCodeInput.value.trim();
  if (!code) return alert('Enter a room code');
  socket.emit('join-room', { code, name: nameInput.value }, (res) => {
    if (res && res.ok) {
      showRoom(res.code, res.room);
      log('Joined room: ' + res.code);
    } else {
      log('Join failed: ' + (res && res.error));
      alert('Join failed: ' + (res && res.error));
    }
  });
};

startBtn.onclick = () => {
  socket.emit('start-game', (res) => {
    if (res && res.ok) {
      log('Start OK');
    } else {
      log('Start failed: ' + (res && res.error));
    }
  });
};

leaveBtn.onclick = () => {
  socket.emit('leave-room');
  hideRoom();
};

sendActionBtn.onclick = () => {
  const txt = actionText.value;
  socket.emit('game-action', { text: txt });
  log('You -> ' + txt);
  actionText.value = '';
};

socket.on('room-update', (room) => {
  showRoomInfo(room);
  log('Room updated: players=' + room.players.length);
});

socket.on('host-changed', ({ newHost }) => {
  log('Host changed to ' + newHost);
});

socket.on('game-start', (payload) => {
  log('GAME START: ' + JSON.stringify(payload));
});

socket.on('game-action', ({ from, payload }) => {
  log('Action from ' + from + ': ' + JSON.stringify(payload));
});

function showRoom(code, room) {
  roomInfo.style.display = 'block';
  roomCodeEl.textContent = code;
  showRoomInfo(room);
}

function showRoomInfo(room) {
  hostIdEl.textContent = room.hostSocketId;
  playersEl.innerHTML = '';
  room.players.forEach(p => {
    const d = document.createElement('div');
    d.className = 'player';
    d.textContent = p.name + ' (' + p.id + ')';
    playersEl.appendChild(d);
  });
  const amHost = socket.id === room.hostSocketId;
  startBtn.style.display = amHost ? 'inline-block' : 'none';
}

function hideRoom() {
  roomInfo.style.display = 'none';
  roomCodeEl.textContent = '';
  playersEl.innerHTML = '';
}