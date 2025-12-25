import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { config } from '../utils/config';
import { AppError } from '../middleware/errorHandler';

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
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
