import { Router, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import { yearEndCountService } from '../services/yearEndCountService';
import { exportService } from '../services/exportService';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Configure Multer with security restrictions
const upload = multer({
  dest: 'tmp/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only allow 1 file per upload
  },
  fileFilter: (_req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(400, errors.array()[0].msg));
  }
  next();
};

// GET /api/year-end-count/all - Get all year-end counts
router.get(
  '/all',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const counts = await prisma.yearEndCount.findMany({
        orderBy: [{ year: 'desc' }, { revision: 'desc' }],
        select: {
          id: true,
          year: true,
          revision: true,
          status: true,
          confirmedAt: true,
          createdAt: true,
        },
      });
      res.json(counts);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/year-end-count - Initiate year-end count
router.post(
  '/',
  [body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { year } = req.body;
      const count = await yearEndCountService.initiateYearEndCount(year);
      res.status(201).json(count);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/pending-reminder - Check for pending count
router.get(
  '/pending-reminder',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reminder = await yearEndCountService.checkPendingCount();
      res.json(reminder);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:year - Get year-end count by year (with optional revision)
router.get(
  '/:year',
  [param('year').isInt().withMessage('Valid year is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.params.year);
      const revision = req.query.revision ? parseInt(req.query.revision as string) : undefined;
      const count = await yearEndCountService.getByYear(year, revision);
      res.json(count);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:year/revisions - Get all revisions for a year
router.get(
  '/:year/revisions',
  [param('year').isInt().withMessage('Valid year is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.params.year);
      const revisions = await yearEndCountService.getAllRevisions(year);
      res.json(revisions);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:year/compare - Compare two revisions
router.get(
  '/:year/compare',
  [
    param('year').isInt().withMessage('Valid year is required'),
    query('revision1').isInt({ min: 1 }).withMessage('revision1 must be a positive integer'),
    query('revision2').isInt({ min: 1 }).withMessage('revision2 must be a positive integer'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.params.year);
      const revision1 = parseInt(req.query.revision1 as string);
      const revision2 = parseInt(req.query.revision2 as string);

      const comparison = await yearEndCountService.compareRevisions(year, revision1, revision2);
      res.json(comparison);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:year/unlock-history - Get unlock history for a year
router.get(
  '/:year/unlock-history',
  [param('year').isInt().withMessage('Valid year is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.params.year);
      const history = await yearEndCountService.getUnlockHistory(year);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/year-end-count/:year/unlock - Unlock a year
router.post(
  '/:year/unlock',
  [
    param('year').isInt().withMessage('Valid year is required'),
    body('reasonCategory').isIn(['data_error', 'recount_required', 'audit_adjustment', 'other'])
      .withMessage('Valid reason category is required'),
    body('description').isString().trim().isLength({ min: 1 })
      .withMessage('Description is required'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const year = parseInt(req.params.year);
      const { reasonCategory, description } = req.body;
      const result = await yearEndCountService.unlockYear(year, reasonCategory, description);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:id/sheet - Get count sheet
router.get(
  '/:id/sheet',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const countSheet = await yearEndCountService.getCountSheet(id);
      res.json(countSheet);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/year-end-count/:id/items/:productId - Update count item
router.put(
  '/:id/items/:productId',
  [
    param('id').isInt().withMessage('Valid count ID is required'),
    param('productId').isInt().withMessage('Valid product ID is required'),
    body('countedQuantity').isInt({ min: 0 }).withMessage('Counted quantity must be >= 0'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const countId = parseInt(req.params.id);
      const productId = parseInt(req.params.productId);
      const { countedQuantity } = req.body;

      const updatedItem = await yearEndCountService.updateCountItem(
        countId,
        productId,
        countedQuantity
      );
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:id/variances - Calculate variances
router.get(
  '/:id/variances',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const variances = await yearEndCountService.calculateVariances(id);
      res.json(variances);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:id/report - Generate year-end report
router.get(
  '/:id/report',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const report = await yearEndCountService.generateYearEndReport(id);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:id/export-csv - Export count sheet to CSV
router.get(
  '/:id/export-csv',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const countSheet = await yearEndCountService.getCountSheet(id);
      const csvPath = await exportService.exportCountSheetCSV(countSheet);

      res.download(csvPath, `count-sheet-${countSheet.year}.csv`, (err) => {
        // Clean up file after download
        exportService.cleanupTempFile(csvPath);
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/year-end-count/:id/export-pdf - Export count sheet to PDF
router.get(
  '/:id/export-pdf',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const countSheet = await yearEndCountService.getCountSheet(id);
      const pdfPath = await exportService.exportCountSheetPDF(countSheet);

      res.download(pdfPath, `count-sheet-${countSheet.year}.pdf`, (err) => {
        // Clean up file after download
        exportService.cleanupTempFile(pdfPath);
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/year-end-count/:id/import-csv - Import count data from CSV
router.post(
  '/:id/import-csv',
  [param('id').isInt().withMessage('Valid count ID is required')],
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const countId = parseInt(req.params.id);

      if (!req.file) {
        throw new AppError(400, 'CSV file is required');
      }

      // Read CSV file
      const csvContent = fs.readFileSync(req.file.path, 'utf-8');

      // Parse and validate CSV
      const importedData = await exportService.importCountDataCSV(csvContent);

      // Match products by name and update counts
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const data of importedData) {
        try {
          // Find product by name
          const product = await prisma.product.findFirst({
            where: {
              name: data.productName,
            },
          });

          if (!product) {
            results.failed++;
            results.errors.push(`Product not found: ${data.productName}`);
            continue;
          }

          // Update count item
          await yearEndCountService.updateCountItem(countId, product.id, data.actualCount);
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${data.productName}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'CSV import completed',
        results,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      next(error);
    }
  }
);

// POST /api/year-end-count/:id/confirm - Confirm year-end count
router.post(
  '/:id/confirm',
  [param('id').isInt().withMessage('Valid count ID is required')],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const confirmedCount = await yearEndCountService.confirmYearEndCount(id);
      res.json(confirmedCount);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
