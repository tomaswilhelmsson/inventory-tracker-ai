import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { backupService } from '../services/backupService';
import multer from 'multer';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Configure multer for file upload (max 100MB)
const upload = multer({
  dest: 'tmp/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// POST /api/backup/export - Export database
router.post(
  '/export',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filePath = await backupService.exportDatabase();
      
      // Extract filename from path
      const filename = filePath.split('/').pop() || 'inventory-backup.json';
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send file and cleanup after
      res.download(filePath, filename, (err) => {
        // Clean up file after download (success or error)
        backupService.cleanupTempFile(filePath);
        if (err && !res.headersSent) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/backup/import - Import database
router.post(
  '/import',
  authMiddleware,
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Validate confirmation
      if (req.body.confirm !== 'true' && req.body.confirm !== true) {
        throw new AppError(400, 'Confirmation required to import database');
      }

      // Validate file upload
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      // Read uploaded file
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');

      // Import database
      const result = await backupService.importDatabase(fileContent);

      // Cleanup uploaded file
      backupService.cleanupTempFile(req.file.path);

      res.json(result);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        backupService.cleanupTempFile(req.file.path);
      }
      next(error);
    }
  }
);

export default router;
