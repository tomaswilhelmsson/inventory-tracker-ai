import { Router, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { inventoryService } from '../services/inventoryService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(400, errors.array()[0].msg));
  }
  next();
};

// GET /api/inventory/value - Get total inventory value
router.get(
  '/value',
  [query('supplierId').optional().isInt().toInt()],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { supplierId } = req.query;
      const inventory = await inventoryService.getInventoryValue({
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
      });
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inventory/product/:productId - Get inventory for specific product
router.get(
  '/product/:productId',
  [param('productId').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.productId);
      const inventory = await inventoryService.getCurrentInventoryValue(productId);
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inventory/lots/:productId - Get lots in FIFO order
router.get(
  '/lots/:productId',
  [param('productId').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.productId);
      const lots = await inventoryService.getLotsByFIFOOrder(productId);
      res.json(lots);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
