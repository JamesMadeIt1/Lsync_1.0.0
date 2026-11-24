
const express = require('express');
const cors = require('cors');

const app = express();

// Global middleware
app.use(cors());

app.use(cors({
  origin: ['http://localhost:5173', 'https://lsync-gules.vercel.app' ,'https://lsync-frontend-th4c.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Required if sending cookies or Authorization headers
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const logsRoutes = require('./src/routes/logsRoutes');
const platformRoutes = require('./src/routes/platformRoutes');
const skillsRoutes = require('./src/routes/skillsRoutes');
const trackRoutes = require('./src/routes/trackRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const githubRoutes = require('./src/routes/githubRoutes');
const youtubeRoutes = require('./src/routes/youtubeRoutes');
const extensionRoutes = require('./src/routes/extensionRoutes');
const watchEventRoutes = require('./src/routes/watchEventRoutes');

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LSync API is running'
  });
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/integrations/github', githubRoutes);
app.use('/api/integrations/youtube', youtubeRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/watch-events', watchEventRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });
});

module.exports = app;
