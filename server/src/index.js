/**
 * index.js — Express server entry point
 *
 * Keeps this file minimal: load env, connect DB, mount routes, listen.
 * All route logic lives in src/routes/. All middleware logic in src/middleware/.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');

const app = express();

// --- Middleware ---------------------------------------------------
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// --- Routes -------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api', incidentRoutes);

// --- Health check (used by Kubernetes probes in later phases) -----
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// --- Global error handler -----------------------------------------
// Catches anything thrown inside route handlers that wasn't caught locally.
// Returns a consistent { error: string } shape as required by CLAUDE.md.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// --- Start --------------------------------------------------------
const PORT = process.env.PORT || 5000;

// ponytail: using simple inline require to initialize socket.io and HTTP server contiguously
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Join a room specific to an incident
  socket.on('join', (incidentId) => {
    socket.join(`incident:${incidentId}`);
  });

  // Leave an incident-specific room
  socket.on('leave', (incidentId) => {
    socket.leave(`incident:${incidentId}`);
  });
});

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app; // exported so supertest can import it without starting a live server
