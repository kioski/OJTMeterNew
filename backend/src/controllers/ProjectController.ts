import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectModel } from '../models/ProjectModel';
import { UserModel } from '../models/UserModel';
import { AuthenticatedRequest, ProjectRequest, ApiResponse } from '../types';

export class ProjectController {
  private projectModel: ProjectModel;
  private userModel: UserModel;

  constructor() {
    this.projectModel = new ProjectModel();
    this.userModel = new UserModel();
  }

  // Validation rules
  static createValidation = [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('assignedUserIds')
      .optional()
      .isArray()
      .withMessage('Assigned user IDs must be an array')
  ];

  static updateValidation = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('assignedUserIds')
      .optional()
      .isArray()
      .withMessage('Assigned user IDs must be an array'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ];

  // Get all projects (admin only)
  async getAllProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const projects = await this.projectModel.getAll();
      
      // Get user information for each project
      const projectsWithUserInfo = await Promise.all(
        projects.map(async (project) => {
          const assignedUsers = await Promise.all(
            project.assignedUserIds.map(async (userId) => {
              const user = await this.userModel.findById(userId);
              return user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              } : null;
            })
          );

          return {
            ...project,
            assignedUsers: assignedUsers.filter(user => user !== null)
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithUserInfo
      });
    } catch (error) {
      console.error('Get all projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get project by ID (admin only)
  async getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await this.projectModel.findById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Get assigned users information
      const assignedUsers = await Promise.all(
        project.assignedUserIds.map(async (userId) => {
          const user = await this.userModel.findById(userId);
          return user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : null;
        })
      );

      res.json({
        success: true,
        data: {
          ...project,
          assignedUsers: assignedUsers.filter(user => user !== null)
        }
      });
    } catch (error) {
      console.error('Get project by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create project (admin only)
  async createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Received project creation request:', req.body);
      console.log('Authenticated user:', req.user);
      
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const projectData: ProjectRequest = req.body;

      // Debug: Log all available users
      const allUsers = await this.userModel.findAll();
      console.log('All available users:', allUsers.map(u => ({ id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}` })));

      // Ensure assignedUserIds is an array
      if (!projectData.assignedUserIds) {
        projectData.assignedUserIds = [];
      }

      // Validate assigned users exist
      if (projectData.assignedUserIds && projectData.assignedUserIds.length > 0) {
        console.log('Validating assigned users:', projectData.assignedUserIds);
        for (const userId of projectData.assignedUserIds) {
          console.log(`Looking up user with ID: ${userId}`);
          const user = await this.userModel.findById(userId);
          console.log(`User lookup result:`, user ? `${user.firstName} ${user.lastName}` : 'NOT FOUND');
          if (!user) {
            res.status(400).json({
              success: false,
              message: `User with ID ${userId} not found`
            });
            return;
          }
        }
      }

      const project = await this.projectModel.create(projectData);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update project (admin only)
  async updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      // Check if project exists
      const existingProject = await this.projectModel.findById(id);
      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Validate assigned users exist
      if (updates.assignedUserIds && updates.assignedUserIds.length > 0) {
        for (const userId of updates.assignedUserIds) {
          const user = await this.userModel.findById(userId);
          if (!user) {
            res.status(400).json({
              success: false,
              message: `User with ID ${userId} not found`
            });
            return;
          }
        }
      }

      const updatedProject = await this.projectModel.update(id, updates);

      if (!updatedProject) {
        res.status(500).json({
          success: false,
          message: 'Failed to update project'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete project (admin only)
  async deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if project exists
      const existingProject = await this.projectModel.findById(id);
      if (!existingProject) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      const deleted = await this.projectModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete project'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Assign user to project (admin only)
  async assignUserToProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId, userId } = req.params;

      // Check if project exists
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Check if user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const success = await this.projectModel.assignUser(projectId, userId);

      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Failed to assign user to project'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User assigned to project successfully'
      });
    } catch (error) {
      console.error('Assign user to project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Remove user from project (admin only)
  async removeUserFromProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { projectId, userId } = req.params;

      // Check if project exists
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      const success = await this.projectModel.removeUser(projectId, userId);

      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Failed to remove user from project'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User removed from project successfully'
      });
    } catch (error) {
      console.error('Remove user from project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get projects for a specific user
  async getProjectsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const projects = await this.projectModel.findByUser(userId);

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Get projects by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
