import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { config } from '../utils/config';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const { username, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      // Always perform bcrypt comparison to prevent timing attacks
      // Use dummy hash for non-existent users to maintain constant time
      const passwordHash = user?.passwordHash || '$2b$10$invalidhashtopreventtimingattack.intentionallybadhashabcdefgh';

      const isValidPassword = await bcrypt.compare(password, passwordHash);
      
      if (!user || !isValidPassword) {
        throw new AppError(401, 'Invalid credentials');
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          preferences: {
            language: user.preferredLanguage,
            currency: user.preferredCurrency,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user (with preferences)
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        preferredLanguage: true,
        preferredCurrency: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      id: user.id,
      username: user.username,
      preferences: {
        language: user.preferredLanguage,
        currency: user.preferredCurrency,
      },
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put(
  '/preferences',
  authMiddleware,
  [
    body('language').optional().isIn(['en', 'sv']).withMessage('Language must be en or sv'),
    body('currency').optional().isIn(['USD', 'SEK']).withMessage('Currency must be USD or SEK'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, errors.array()[0].msg);
      }

      const userId = (req as any).user.id;
      const { language, currency } = req.body;

      // At least one preference must be provided
      if (!language && !currency) {
        throw new AppError(400, 'At least one preference (language or currency) must be provided');
      }

      const updateData: any = {};
      if (language) updateData.preferredLanguage = language;
      if (currency) updateData.preferredCurrency = currency;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          preferredLanguage: true,
          preferredCurrency: true,
        },
      });

      res.json({
        message: 'Preferences updated successfully',
        preferences: {
          language: updatedUser.preferredLanguage,
          currency: updatedUser.preferredCurrency,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
