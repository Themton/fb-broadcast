require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const broadcastRoutes = require('./routes/broadcast');
const segmentRoutes = require('./routes/segments');
const subscriberRoutes = require('./routes/subscribers');
const pageRoutes = require('./routes/page');
const scheduleService = require('./utils/scheduler');
const { testConnection } = require('./utils/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logger ──
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ── API Routes ──
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/page', pageRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'supabase',
    connected: !!process.env.FB_PAGE_ACCESS_TOKEN,
  });
});

// ── Serve Frontend in Production ──
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ──
async function start() {
  // Test Supabase connection
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('\n❌ Cannot start: Supabase not configured properly');
    console.log('💡 Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    console.log('💡 Then run migration.sql in Supabase SQL Editor\n');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Broadcast Server running on port ${PORT}`);
    console.log(`📦 Database: Supabase ${dbOk ? '✅' : '❌'}`);
    console.log(`📡 Facebook: ${process.env.FB_PAGE_ACCESS_TOKEN ? 'Token set ✅' : 'Not configured'}`);
    console.log(`🔗 Client: ${process.env.CLIENT_URL || '*'}\n`);
    scheduleService.init();
  });
}

start();
