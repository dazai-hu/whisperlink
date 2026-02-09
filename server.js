import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the 'dist' directory after build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// In-memory "Database"
let users = [];
let messages = [];

const EPHEMERAL_DURATION_MS = 5 * 60 * 1000;

// Cleanup Job: Runs every 5 seconds
setInterval(() => {
  const now = Date.now();
  const initialLength = messages.length;
  messages = messages.filter(m => !m.expiresAt || now < m.expiresAt);
  if (messages.length !== initialLength) {
    io.emit('db_update');
  }
}, 5000);

// API Routes
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username exists' });
  }
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    passwordHash: password,
    bio: 'Whispering in the leaves...',
    createdAt: Date.now()
  };
  users.push(newUser);
  res.json(newUser);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.get('/api/users/search/:username', (req, res) => {
  const user = users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.patch('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

app.get('/api/messages/:u1/:u2', (req, res) => {
  const { u1, u2 } = req.params;
  const chat = messages.filter(m => 
    (m.senderId === u1 && m.receiverId === u2) || 
    (m.senderId === u2 && m.receiverId === u1)
  ).sort((a, b) => a.timestamp - b.timestamp);
  res.json(chat);
});

app.get('/api/chats/:userId', (req, res) => {
  const { userId } = req.params;
  const interactedIds = new Set();
  messages.forEach(m => {
    if (m.senderId === userId) interactedIds.add(m.receiverId);
    if (m.receiverId === userId) interactedIds.add(m.senderId);
  });

  const results = Array.from(interactedIds).map(id => {
    const otherUser = users.find(u => u.id === id);
    if (!otherUser) return null;
    const chat = messages.filter(m => 
      (m.senderId === userId && m.receiverId === id) || 
      (m.senderId === id && m.receiverId === userId)
    ).sort((a, b) => b.timestamp - a.timestamp);
    const unreadCount = chat.filter(m => m.receiverId === userId && !m.viewedAt).length;
    return { otherUser, lastMessage: chat[0], unreadCount };
  }).filter(Boolean);

  res.json(results);
});

// WebSocket logic
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('send_message', (data) => {
    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      timestamp: Date.now(),
      viewedAt: null,
      expiresAt: null
    };
    messages.push(msg);
    io.to(data.receiverId).emit('new_message', msg);
    io.to(data.senderId).emit('new_message', msg);
  });

  socket.on('mark_viewed', (messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.viewedAt) {
      msg.viewedAt = Date.now();
      msg.expiresAt = msg.viewedAt + EPHEMERAL_DURATION_MS;
      io.to(msg.senderId).emit('message_updated', msg);
      io.to(msg.receiverId).emit('message_updated', msg);
    }
  });
});

// Fallback to SPA routing - must be after other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send("Build not found. Please run 'npm run build' first.");
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WhisperLink server humming on port ${PORT}`);
});