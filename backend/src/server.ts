import express from 'express';
import cors from 'cors';
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

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
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

export default app;
