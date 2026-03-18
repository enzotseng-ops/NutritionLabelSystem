require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const nutritionDataRoutes = require('./routes/nutritionData');
const allergenRoutes = require('./routes/allergens');
const labelRoutes = require('./routes/labels');
const importRoutes = require('./routes/import');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Cloudflare Tunnel / reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:5173', 'https://labels.openclaw-gb.com'],
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// API router – mounted at both /api and /api-proxy (Cloudflare Tunnel)
const apiRouter = express.Router();
apiRouter.use('/nutrition-data', nutritionDataRoutes);
apiRouter.use('/allergens', allergenRoutes);
apiRouter.use('/labels', labelRoutes);
apiRouter.use('/import', importRoutes);
apiRouter.use('/export', exportRoutes);
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);
app.use('/api-proxy', apiRouter);

// Serve frontend static build
const clientDist = require('path').resolve(__dirname, '../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(require('express').static(clientDist, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));
  app.get('*', (_req, res) => res.sendFile(require('path').join(clientDist, 'index.html')));
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
