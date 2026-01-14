# Team-Code 10-player Prototype

This prototype implements a simple server + web client where up to 10 players can join a game by:
- Online: create a room on a publicly reachable server and others join using a team code.
- Offline (same hotspot/LAN): run the server on the host machine (the host acts as the server). Players open the client and connect to the host's LAN IP and port.

Quick start (local):
1. Node.js >= 16 installed
2. npm install
3. npm start
4. Open http://localhost:3000 on the host machine to create a room.
5. Other devices on the same hotspot open http://HOST_IP:3000 and enter the team code (or the host's IP:port if joining directly).

Notes:
- For online sharing across the internet you need a publicly reachable server (deploy to a VPS, or use ngrok during testing).
- Browsers cannot perform UDP broadcast discovery; for LAN auto-discovery you need a native app or a small local discovery server.
- This prototype is in-memory only. For production, add persistence, authentication, validation, rate-limiting, and secure transports (HTTPS/WSS).