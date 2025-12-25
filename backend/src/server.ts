import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import supplierRoutes from './routes/suppliers';
import productRoutes from './routes/products';
import unitRoutes from './routes/units';
import purchaseRoutes from './routes/purchases';
import inventoryRoutes from './routes/inventory';
import yearEndCountRoutes from './routes/yearEndCount';
import { exportService } from './services/exportService';

const app = express();

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

// CORS configuration with origin validation
const allowedOrigins = [
  config.frontendUrl,
  // Add additional allowed origins from environment if provided
  ...(process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting to all /api/* routes
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth/login', authLimiter); // Apply stricter rate limit to login
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/units', authMiddleware, unitRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/year-end-count', authMiddleware, yearEndCountRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
});

// Schedule cleanup of old temp files every hour
setInterval(() => {
  exportService.cleanupOldTempFiles();
}, 60 * 60 * 1000); // Run every hour

// Run initial cleanup on startup
exportService.cleanupOldTempFiles();

export default app;
