import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TimeLogModel } from '../models/TimeLogModel';
import { UserModel } from '../models/UserModel';
import { ProjectModel } from '../models/ProjectModel';
import { getBlobStorage } from '../services/BlobStorageService';
import { TimeLogFilters, UserRole } from '../types';

export class ExportController {
  private timeLogModel: TimeLogModel;
  private userModel: UserModel;
  private projectModel: ProjectModel;

  constructor() {
    this.timeLogModel = new TimeLogModel();
    this.userModel = new UserModel();
    this.projectModel = new ProjectModel();
  }

  // Validation rules
  static exportValidation = [
    body('format')
      .isIn(['csv', 'excel'])
      .withMessage('Format must be either csv or excel'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    body('userId')
      .optional()
      .isString()
      .withMessage('User ID must be a string'),
    body('projectId')
      .optional()
      .isString()
      .withMessage('Project ID must be a string')
  ];

  async exportTimeLogs(req: Request, res: Response): Promise<void> {
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

      const { format, startDate, endDate, userId, projectId } = req.body;
      const currentUser = (req as any).user;

      // Check if user has permission to export
      if (currentUser.role === UserRole.USER && userId && userId !== currentUser.id) {
        res.status(403).json({
          success: false,
          message: 'You can only export your own time logs'
        });
        return;
      }

      // Build filters
      const filters: TimeLogFilters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (userId) filters.userId = userId;
      if (projectId) filters.projectId = projectId;

      // Get time logs
      const timeLogs = await this.timeLogModel.findByFilters(filters, 10000); // Large limit for exports

      if (timeLogs.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No time logs found for the specified criteria'
        });
        return;
      }

      // Enrich data with user and project information
      const enrichedData = await this.enrichTimeLogData(timeLogs);

      // Export to blob storage
      const blobStorage = getBlobStorage();
      if (!blobStorage) {
        res.status(503).json({
          success: false,
          message: 'Export service is not available'
        });
        return;
      }

      const exportResult = await blobStorage.exportData({
        format,
        data: enrichedData,
        filename: `time-logs-export-${new Date().toISOString().split('T')[0]}.${format}`,
        expiresInMinutes: 60
      });

      res.json({
        success: true,
        data: exportResult,
        message: 'Export created successfully'
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create export'
      });
    }
  }

  async exportUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = (req as any).user;

      // Only admins can export user data
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to export user data'
        });
        return;
      }

      const users = await this.userModel.findAll();
      
      if (users.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No users found'
        });
        return;
      }

      // Prepare user data for export (exclude passwords)
      const exportData = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        projectCount: user.projectIds?.length || 0
      }));

      const blobStorage = getBlobStorage();
      if (!blobStorage) {
        res.status(503).json({
          success: false,
          message: 'Export service is not available'
        });
        return;
      }

      const exportResult = await blobStorage.exportData({
        format: 'csv',
        data: exportData,
        filename: `users-export-${new Date().toISOString().split('T')[0]}.csv`,
        expiresInMinutes: 60
      });

      res.json({
        success: true,
        data: exportResult,
        message: 'User export created successfully'
      });
    } catch (error) {
      console.error('User export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user export'
      });
    }
  }

  async exportProjects(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = (req as any).user;

      // Only admins can export project data
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to export project data'
        });
        return;
      }

      const projects = await this.projectModel.getAll();
      
      if (projects.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No projects found'
        });
        return;
      }

      // Enrich project data with user information
      const enrichedData = await Promise.all(projects.map(async (project) => {
        const assignedUsers = await Promise.all(
          project.assignedUserIds.map(async (userId) => {
            const user = await this.userModel.findById(userId);
            return user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Unknown User';
          })
        );

        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          assignedUsers: assignedUsers.join('; '),
          assignedUserCount: project.assignedUserIds.length,
          isActive: project.isActive,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
      }));

      const blobStorage = getBlobStorage();
      if (!blobStorage) {
        res.status(503).json({
          success: false,
          message: 'Export service is not available'
        });
        return;
      }

      const exportResult = await blobStorage.exportData({
        format: 'csv',
        data: enrichedData,
        filename: `projects-export-${new Date().toISOString().split('T')[0]}.csv`,
        expiresInMinutes: 60
      });

      res.json({
        success: true,
        data: exportResult,
        message: 'Project export created successfully'
      });
    } catch (error) {
      console.error('Project export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project export'
      });
    }
  }

  async getExportStats(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = (req as any).user;

      // Only admins can view export stats
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view export statistics'
        });
        return;
      }

      const blobStorage = getBlobStorage();
      if (!blobStorage) {
        res.status(503).json({
          success: false,
          message: 'Export service is not available'
        });
        return;
      }

      const stats = await blobStorage.getStorageStats();

      res.json({
        success: true,
        data: stats,
        message: 'Export statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Export stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve export statistics'
      });
    }
  }

  private async enrichTimeLogData(timeLogs: any[]): Promise<any[]> {
    return Promise.all(timeLogs.map(async (log) => {
      // Get user information
      const user = await this.userModel.findById(log.userId);
      
      // Get project information
      let project = null;
      if (log.projectId) {
        project = await this.projectModel.findById(log.projectId);
      }

      return {
        id: log.id,
        date: log.date,
        hours: log.hours,
        description: log.description || '',
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        userEmail: user ? user.email : 'Unknown',
        projectName: project ? project.name : 'No Project',
        projectDescription: project ? project.description : '',
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
      };
    }));
  }
}
