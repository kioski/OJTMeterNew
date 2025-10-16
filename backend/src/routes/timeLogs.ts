import { Router } from 'express';
import { TimeLogController } from '../controllers/TimeLogController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
let timeLogController: TimeLogController;

// Initialize controller lazily to avoid database initialization issues
const getTimeLogController = () => {
  if (!timeLogController) {
    timeLogController = new TimeLogController();
  }
  return timeLogController;
};

// All routes require authentication
router.use(authenticateToken);

// Time log CRUD operations
router.post('/', TimeLogController.createValidation, (req, res) => getTimeLogController().createTimeLog(req, res));
router.get('/', TimeLogController.queryValidation, (req, res) => getTimeLogController().getTimeLogs(req, res));
router.get('/total-hours', (req, res) => getTimeLogController().getTotalHours(req, res));
router.get('/date-range', (req, res) => getTimeLogController().getHoursByDateRange(req, res));
router.get('/:id', (req, res) => getTimeLogController().getTimeLogById(req, res));
router.put('/:id', TimeLogController.updateValidation, (req, res) => getTimeLogController().updateTimeLog(req, res));
router.delete('/:id', (req, res) => getTimeLogController().deleteTimeLog(req, res));

export default router;
