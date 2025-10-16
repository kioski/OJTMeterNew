import { Router } from 'express';
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
router.post('/register', AuthController.registerValidation, (req, res) => getAuthController().register(req, res));
router.post('/login', AuthController.loginValidation, (req, res) => getAuthController().login(req, res));
router.post('/create-admin', (req, res) => getAuthController().createFirstAdmin(req, res));

// Protected routes
router.get('/profile', authenticateToken, (req, res) => getAuthController().getProfile(req, res));
router.put('/profile', authenticateToken, (req, res) => getAuthController().updateProfile(req, res));
router.put('/change-password', authenticateToken, (req, res) => getAuthController().changePassword(req, res));

export default router;
