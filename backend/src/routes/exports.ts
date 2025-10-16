import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ExportController } from '../controllers/ExportController';
import { UserRole } from '../types';

const router = express.Router();
const exportController = new ExportController();

// Apply authentication to all routes
router.use(authenticateToken);

// Export time logs
router.post('/time-logs', 
  ExportController.exportValidation,
  exportController.exportTimeLogs.bind(exportController)
);

// Export users (admin only)
router.post('/users',
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  exportController.exportUsers.bind(exportController)
);

// Export projects (admin only)
router.post('/projects',
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  exportController.exportProjects.bind(exportController)
);

// Get export statistics (admin only)
router.get('/stats',
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  exportController.getExportStats.bind(exportController)
);

export default router;
