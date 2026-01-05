import { Router, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { finishedGoodService } from '../services/finishedGoodService';
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

// GET /api/finished-goods - List all finished goods
router.get(
  '/',
  [query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const finishedGoods = await finishedGoodService.getAll({ isActive });
      res.json(finishedGoods);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/finished-goods/:id - Get by ID
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid finished good ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const finishedGood = await finishedGoodService.getById(id);
      res.json(finishedGood);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/finished-goods - Create new
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('unitId').isInt().withMessage('Valid unit ID is required'),
    body('materialCost').isFloat({ min: 0 }).withMessage('Material cost must be zero or greater'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, unitId, materialCost } = req.body;
      const finishedGood = await finishedGoodService.create({
        name,
        description,
        unitId: parseInt(unitId),
        materialCost: parseFloat(materialCost),
      });
      res.status(201).json(finishedGood);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/finished-goods/:id - Update
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid finished good ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('unitId').optional().isInt().withMessage('Valid unit ID is required'),
    body('materialCost').optional().isFloat({ min: 0 }).withMessage('Material cost must be zero or greater'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, unitId, materialCost, isActive } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (unitId !== undefined) updateData.unitId = parseInt(unitId);
      if (materialCost !== undefined) updateData.materialCost = parseFloat(materialCost);
      if (isActive !== undefined) updateData.isActive = isActive;

      const finishedGood = await finishedGoodService.update(id, updateData);
      res.json(finishedGood);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/finished-goods/:id/cost - Update material cost only
router.patch(
  '/:id/cost',
  [
    param('id').isInt().withMessage('Invalid finished good ID'),
    body('materialCost').isFloat({ min: 0 }).withMessage('Material cost must be zero or greater'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { materialCost } = req.body;
      const finishedGood = await finishedGoodService.updateMaterialCost(id, parseFloat(materialCost));
      res.json(finishedGood);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/finished-goods/:id - Delete
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid finished good ID')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await finishedGoodService.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
