import { Router, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { unitService } from '../services/unitService';
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

// GET /api/units - Get all units
router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const units = await unitService.getAll();
      res.json(units);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/units/:id - Get unit by ID
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid unit ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await unitService.getById(id);
      res.json(unit);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/units - Create unit
router.post(
  '/',
  [
    body('name')
      .notEmpty()
      .withMessage('Unit name is required')
      .trim()
      .isLength({ max: 50 })
      .withMessage('Unit name must be 50 characters or less'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const unit = await unitService.create(req.body);
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/units/:id - Update unit
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid unit ID'),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Unit name cannot be empty')
      .trim()
      .isLength({ max: 50 })
      .withMessage('Unit name must be 50 characters or less'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await unitService.update(id, req.body);
      res.json(unit);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/units/:id - Delete unit
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid unit ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await unitService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
