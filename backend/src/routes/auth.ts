import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
let authController: AuthController;

// Initialize controller lazily to avoid database initialization issues
const getAuthController = () => {
  if (!authController) {
    authController = new AuthController();
  }
  return authController;
};

// Public routes
router.post('/register', AuthController.registerValidation, (req: Request, res: Response) => getAuthController().register(req, res));
router.post('/login', AuthController.loginValidation, (req: Request, res: Response) => getAuthController().login(req, res));
router.post('/create-admin', (req: Request, res: Response) => getAuthController().createFirstAdmin(req, res));

// Protected routes
router.get('/profile', authenticateToken, (req: Request, res: Response) => getAuthController().getProfile(req, res));
router.put('/profile', authenticateToken, (req: Request, res: Response) => getAuthController().updateProfile(req, res));
router.put('/change-password', authenticateToken, (req: Request, res: Response) => getAuthController().changePassword(req, res));

export default router;
