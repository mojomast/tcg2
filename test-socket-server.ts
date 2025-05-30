import { Server } from 'socket.io';

const PORT = 3001; // Use a DIFFERENT port to avoid conflict with your main server

console.log(`[TestSocketServer] Attempting to start Socket.IO server on port ${PORT}`);

const io = new Server(PORT, {
  cors: {
    origin: "*", // Allow all for this test
    methods: ["GET", "POST"]
  },
  transports: ['websocket'] // Force websockets for simplicity in test
});

io.on('connection', (socket) => {
  console.log(`[TestSocketServer] Client connected: ${socket.id}`);
  socket.emit('test_message', { hello: 'world from test server' });

  socket.on('disconnect', (reason) => {
    console.log(`[TestSocketServer] Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  socket.on('client_ping', (data) => {
    console.log(`[TestSocketServer] Received ping from ${socket.id}:`, data);
    socket.emit('server_pong', { message: 'Pong back at ya!' });
  });
});

io.engine.on('connection_error', (err) => {
  console.error('[TestSocketServer] Engine Connection Error:', err.code, err.message, err.context);
});

console.log(`[TestSocketServer] Socket.IO server supposedly listening on port ${PORT}`);
