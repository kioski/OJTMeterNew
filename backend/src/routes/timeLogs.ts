import { Router, Request, Response } from 'express';
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
router.post('/', TimeLogController.createValidation, (req: Request, res: Response) => getTimeLogController().createTimeLog(req, res));
router.get('/', TimeLogController.queryValidation, (req: Request, res: Response) => getTimeLogController().getTimeLogs(req, res));
router.get('/total-hours', (req: Request, res: Response) => getTimeLogController().getTotalHours(req, res));
router.get('/date-range', (req: Request, res: Response) => getTimeLogController().getHoursByDateRange(req, res));
router.get('/:id', (req: Request, res: Response) => getTimeLogController().getTimeLogById(req, res));
router.put('/:id', TimeLogController.updateValidation, (req: Request, res: Response) => getTimeLogController().updateTimeLog(req, res));
router.delete('/:id', (req: Request, res: Response) => getTimeLogController().deleteTimeLog(req, res));

export default router;
