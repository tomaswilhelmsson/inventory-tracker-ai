import { Router, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { purchaseService } from '../services/purchaseService';
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

// GET /api/purchases/locked-years - Get all locked years
router.get(
  '/locked-years',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🔓 Fetching locked years...');
      const lockedYears = await purchaseService.getLockedYears();
      res.json(lockedYears);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/purchases - Get all purchase lots
router.get(
  '/',
  [
    query('productId').optional().isInt().toInt(),
    query('supplierId').optional().isInt().toInt(),
    query('year').optional().isInt().toInt(),
    query('batchId').optional().isInt().toInt(),
    query('hasRemainingInventory').optional().isBoolean().toBoolean(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productId, supplierId, year, batchId, hasRemainingInventory } = req.query;
      const purchases = await purchaseService.getAll({
        productId: productId ? parseInt(productId as string) : undefined,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        batchId: batchId ? parseInt(batchId as string) : undefined,
        hasRemainingInventory: hasRemainingInventory === 'true',
      });
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/purchases/:id - Get purchase lot by ID
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid purchase lot ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await purchaseService.getById(id);
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/purchases - Create purchase lot
router.post(
  '/',
  [
    body('productId').isInt().withMessage('Valid product ID is required'),
    body('supplierId').isInt().withMessage('Valid supplier ID is required'),
    body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('unitCost').isFloat({ gt: 0 }).withMessage('Unit cost must be greater than 0'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const purchase = await purchaseService.create({
        ...req.body,
        purchaseDate: new Date(req.body.purchaseDate),
      });
      res.status(201).json(purchase);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/purchases/:id - Update purchase lot
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid purchase lot ID'),
    body('purchaseDate').optional().isISO8601().withMessage('Valid purchase date is required'),
    body('quantity').optional().isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('unitCost').optional().isFloat({ gt: 0 }).withMessage('Unit cost must be greater than 0'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: any = {};
      
      if (req.body.purchaseDate) {
        updateData.purchaseDate = new Date(req.body.purchaseDate);
      }
      if (req.body.quantity !== undefined) {
        updateData.quantity = req.body.quantity;
      }
      if (req.body.unitCost !== undefined) {
        updateData.unitCost = req.body.unitCost;
      }

      const purchase = await purchaseService.update(id, updateData);
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/purchases/:id - Delete purchase lot
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid purchase lot ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await purchaseService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/purchases/batch - Create batch purchase
router.post(
  '/batch',
  [
    body('supplierId').isInt().withMessage('Valid supplier ID is required'),
    body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
    body('verificationNumber').optional().isString().trim().isLength({ max: 100 }),
    body('shippingCost').isFloat({ min: 0 }).withMessage('Shipping cost must be >= 0'),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
    body('items').isArray({ min: 1 }).withMessage('At least 1 item is required'),
    body('items.*.productId').isInt().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be > 0'),
    body('items.*.unitCost').optional().isFloat({ gt: 0 }).withMessage('Unit cost must be > 0'),
    body('items.*.totalCost').optional().isFloat({ gt: 0 }).withMessage('Total cost must be > 0'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { supplierId, purchaseDate, verificationNumber, shippingCost, notes, items } = req.body;

      const result = await purchaseService.createBatch({
        supplierId,
        purchaseDate: new Date(purchaseDate),
        verificationNumber,
        shippingCost,
        notes,
        items,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/purchases/batch/:id - Get batch by ID
router.get(
  '/batch/:id',
  [param('id').isInt().withMessage('Invalid batch ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const batch = await purchaseService.getBatchById(id);
      res.json(batch);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
