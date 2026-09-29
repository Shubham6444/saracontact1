require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const leadRoutes = require('./routes/leads');
const uploadRoutes = require('./routes/uploads');
const connectDatabase = require('./config/db');

const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

function configureApp() {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-only-change-this-secret',
    resave: false, saveUninitialized: false,
    store: MongoStore.create({ client: mongoose.connection.getClient() }),
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'offline' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/post/:id', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'post.html')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error.' });
  });
}

const port = process.env.PORT || 3000;
async function start() {
  await connectDatabase();
  configureApp();
  app.listen(port, () => console.log(`SevaMitra running at http://localhost:${port}`));
}
start().catch(() => { process.exitCode = 1; });
