import { Router, Request, Response } from 'express';
import { AdminController } from '../controllers/AdminController';
import { AdminTimeLogController } from '../controllers/AdminTimeLogController';
import { ProjectController } from '../controllers/ProjectController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
let adminController: AdminController;
let adminTimeLogController: AdminTimeLogController;
let projectController: ProjectController;

// Initialize controller lazily to avoid database initialization issues
const getAdminController = () => {
  if (!adminController) {
    adminController = new AdminController();
  }
  return adminController;
};

const getAdminTimeLogController = () => {
  if (!adminTimeLogController) {
    adminTimeLogController = new AdminTimeLogController();
  }
  return adminTimeLogController;
};

const getProjectController = () => {
  if (!projectController) {
    projectController = new ProjectController();
  }
  return projectController;
};

// Test endpoint for project creation (no auth required)
router.post('/projects/test', (req, res) => {
  console.log('Test project creation endpoint hit');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body
  });
});

// Project management routes (temporarily without auth for testing)
router.get('/projects', (req: Request, res: Response) => getProjectController().getAllProjects(req, res));
router.get('/projects/:id', (req: Request, res: Response) => getProjectController().getProjectById(req, res));
router.post('/projects', ProjectController.createValidation, (req: Request, res: Response) => getProjectController().createProject(req, res));
router.put('/projects/:id', ProjectController.updateValidation, (req: Request, res: Response) => getProjectController().updateProject(req, res));
router.delete('/projects/:id', (req: Request, res: Response) => getProjectController().deleteProject(req, res));
router.post('/projects/:projectId/assign/:userId', (req: Request, res: Response) => getProjectController().assignUserToProject(req, res));
router.delete('/projects/:projectId/remove/:userId', (req: Request, res: Response) => getProjectController().removeUserFromProject(req, res));
router.get('/users/:userId/projects', (req: Request, res: Response) => getProjectController().getProjectsByUser(req, res));

// Debug endpoint to check users without authentication
router.get('/debug/users', (req, res) => {
  const cosmosDB = require('../utils/cosmos').getCosmosDB();
  const usersContainer = cosmosDB.getContainer('Users');
  const users = usersContainer.items.query({ query: 'SELECT * FROM c' }).fetchAll();
  users.then((result: any) => {
    res.json({
      success: true,
      data: result.resources.map((u: any) => ({ id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}` }))
    });
  }).catch((error: any) => {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  });
});

// All admin routes require authentication (temporarily removed admin role requirement for testing)
router.use(authenticateToken);
// router.use(requireAdmin); // Temporarily commented out for testing

// User management routes
router.get('/users', (req: Request, res: Response) => getAdminController().getAllUsers(req, res));
router.post('/users', AdminController.createUserValidation, (req: Request, res: Response) => getAdminController().createUser(req, res));
router.put('/users/:id', (req: Request, res: Response) => getAdminController().updateUser(req, res));
router.delete('/users/:id', (req: Request, res: Response) => getAdminController().deleteUser(req, res));
router.patch('/users/:id/toggle-status', (req: Request, res: Response) => getAdminController().toggleUserStatus(req, res));

// Time logs management routes (admin only)
router.get('/time-logs', AdminTimeLogController.queryValidation, (req: Request, res: Response) => getAdminTimeLogController().getAllTimeLogs(req, res));
router.get('/time-logs/user/:userId', AdminTimeLogController.queryValidation, (req: Request, res: Response) => getAdminTimeLogController().getTimeLogsByUser(req, res));
router.get('/time-logs/summary', AdminTimeLogController.queryValidation, (req: Request, res: Response) => getAdminTimeLogController().getSummaryStats(req, res));

export default router;
