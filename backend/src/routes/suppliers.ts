import { Router, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supplierService } from '../services/supplierService';
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

// GET /api/suppliers - Get all suppliers
router.get(
  '/',
  [query('search').optional().isString()],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search } = req.query;
      const suppliers = await supplierService.getAll(search as string | undefined);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/suppliers/:id - Get supplier by ID
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid supplier ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await supplierService.getById(id);
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/suppliers - Create supplier
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('contactPerson').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('taxId').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const supplier = await supplierService.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/suppliers/:id - Update supplier
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid supplier ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('contactPerson').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('taxId').optional().isString().trim(),
    body('notes').optional().isString().trim(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await supplierService.update(id, req.body);
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/suppliers/:id - Delete supplier
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid supplier ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await supplierService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
