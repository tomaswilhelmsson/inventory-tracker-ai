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
  [
    query('search').optional().isString(),
    query('supplierId').optional().isInt().toInt(),
    query('includeInactive').optional().isBoolean().toBoolean(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search, supplierId, includeInactive } = req.query;
      const products = await productService.getAll({
        search: search as string | undefined,
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        includeInactive: includeInactive === 'true',
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
    body('supplierIds').isArray({ min: 1 }).withMessage('At least one supplier is required'),
    body('supplierIds.*').isInt().withMessage('Each supplier ID must be an integer'),
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
    body('supplierIds').optional().isArray({ min: 1 }).withMessage('At least one supplier is required'),
    body('supplierIds.*').optional().isInt().withMessage('Each supplier ID must be an integer'),
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

// POST /api/products/:id/suppliers - Add supplier to product
router.post(
  '/:id/suppliers',
  [
    param('id').isInt().withMessage('Invalid product ID'),
    body('supplierId').isInt().withMessage('Valid supplier ID is required'),
    body('preferredUnitCost').optional().isFloat({ min: 0 }).withMessage('Preferred unit cost must be a positive number'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.id);
      const { supplierId, preferredUnitCost } = req.body;
      const result = await productService.addSupplier(productId, supplierId, preferredUnitCost);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/products/:id/suppliers/:supplierId - Remove supplier from product
router.delete(
  '/:id/suppliers/:supplierId',
  [
    param('id').isInt().withMessage('Invalid product ID'),
    param('supplierId').isInt().withMessage('Invalid supplier ID'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.id);
      const supplierId = parseInt(req.params.supplierId);
      const result = await productService.removeSupplier(productId, supplierId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/products/:id/suppliers/:supplierId - Update preferred unit cost
router.patch(
  '/:id/suppliers/:supplierId',
  [
    param('id').isInt().withMessage('Invalid product ID'),
    param('supplierId').isInt().withMessage('Invalid supplier ID'),
    body('preferredUnitCost').isFloat({ min: 0 }).withMessage('Preferred unit cost must be a positive number'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.id);
      const supplierId = parseInt(req.params.supplierId);
      const { preferredUnitCost } = req.body;
      const result = await productService.updateSupplierCost(productId, supplierId, preferredUnitCost);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:id/suppliers/:supplierId/suggested-price - Get suggested price
router.get(
  '/:id/suppliers/:supplierId/suggested-price',
  [
    param('id').isInt().withMessage('Invalid product ID'),
    param('supplierId').isInt().withMessage('Invalid supplier ID'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const productId = parseInt(req.params.id);
      const supplierId = parseInt(req.params.supplierId);
      const result = await productService.getSuggestedPrice(productId, supplierId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/products/:id/toggle-active - Toggle product active status
router.patch(
  '/:id/toggle-active',
  [param('id').isInt().withMessage('Invalid product ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.toggleActive(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
