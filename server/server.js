import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import adSetRoutes from './routes/adSetRoutes.js';
import adRoutes from './routes/adRoutes.js';
import columnRoutes from './routes/columnRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Connect to Database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());

// Production & Development CORS Configuration
const extractDomain = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    return url.replace(/\/+$/, '');
  }
};

const configuredClientDomain = extractDomain(process.env.CLIENT_URL);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isHostinger = origin.includes('hostingersite.com');
    const isMatchesConfigured = configuredClientDomain && origin.startsWith(configuredClientDomain);

    if (isLocal || isHostinger || isMatchesConfigured) {
      return callback(null, true);
    }

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// JSON Request Parser
app.use(express.json({ limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // max 2000 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Meta Ads Manager Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      campaigns: '/api/campaigns',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/adsets', adSetRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
