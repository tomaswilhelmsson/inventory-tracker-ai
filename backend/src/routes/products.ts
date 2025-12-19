import { Router, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { productService } from '../services/productService';
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

// GET /api/products - Get all products
router.get(
  '/',
  [query('search').optional().isString(), query('supplierId').optional().isInt().toInt()],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search, supplierId } = req.query;
      const products = await productService.getAll({
        search: search as string | undefined,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
      });
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:id - Get product by ID
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.getById(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/products - Create product
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('description').optional().isString().trim(),
    body('unitId').isInt().withMessage('Valid unit ID is required'),
    body('supplierId').isInt().withMessage('Valid supplier ID is required'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await productService.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/products/:id - Update product
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('description').optional().isString().trim(),
    body('unitId').optional().isInt().withMessage('Valid unit ID is required'),
    body('supplierId').optional().isInt().withMessage('Valid supplier ID is required'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.update(id, req.body);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/products/:id - Delete product
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await productService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
