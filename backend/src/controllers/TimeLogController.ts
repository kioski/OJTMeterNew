import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { TimeLogModel } from '../models/TimeLogModel';
import { ProjectModel } from '../models/ProjectModel';
import { AuthenticatedRequest, TimeLogRequest, TimeLogFilters, ApiResponse } from '../types';

export class TimeLogController {
  private timeLogModel: TimeLogModel;
  private projectModel: ProjectModel;

  constructor() {
    this.timeLogModel = new TimeLogModel();
    this.projectModel = new ProjectModel();
  }

  // Validation rules
  static createValidation = [
    body('date')
      .isISO8601()
      .withMessage('Please provide a valid date'),
    body('hours')
      .isFloat({ min: 0.1, max: 24 })
      .withMessage('Hours must be between 0.1 and 24'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ];

  static updateValidation = [
    body('hours')
      .optional()
      .isFloat({ min: 0.1, max: 24 })
      .withMessage('Hours must be between 0.1 and 24'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ];

  static queryValidation = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date')
  ];

  async createTimeLog(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const userId = req.user!.id;
      const timeLogData: TimeLogRequest = req.body;

      // If projectId is provided, verify user has access to it
      if (timeLogData.projectId) {
        const project = await this.projectModel.findById(timeLogData.projectId);
        if (!project) {
          res.status(404).json({
            success: false,
            message: 'Project not found'
          });
          return;
        }
        // For development, allow all users to log time to any project
        // In production, you would check: !project.assignedUserIds.includes(userId)
        if (project.assignedUserIds && project.assignedUserIds.length > 0 && !project.assignedUserIds.includes(userId)) {
          res.status(403).json({
            success: false,
            message: 'You do not have access to this project'
          });
          return;
        }
      }

      // Check for duplicate entry on the same date
      const existingLogs = await this.timeLogModel.findByUser(userId);
      const duplicateLog = existingLogs.find(log => 
        log.date.toDateString() === new Date(timeLogData.date).toDateString() &&
        log.projectId === timeLogData.projectId
      );

      if (duplicateLog) {
        res.status(409).json({
          success: false,
          message: 'Time log already exists for this date and project'
        });
        return;
      }

      const timeLog = await this.timeLogModel.create(userId, timeLogData);

      res.status(201).json({
        success: true,
        data: timeLog,
        message: 'Time log created successfully'
      });
    } catch (error) {
      console.error('Create time log error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTimeLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const userId = req.user!.id;
      const { page = 1, limit = 50, startDate, endDate, projectId } = req.query;

      const filters: TimeLogFilters = {
        userId,
        projectId: projectId as string,
        startDate: startDate as string,
        endDate: endDate as string
      };

      const timeLogs = await this.timeLogModel.findByFilters(filters, Number(limit));
      const totalHours = await this.timeLogModel.getTotalHoursByUser(userId);

      res.json({
        success: true,
        data: {
          timeLogs,
          totalHours,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: timeLogs.length
          }
        }
      });
    } catch (error) {
      console.error('Get time logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTimeLogById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const timeLog = await this.timeLogModel.findById(id, userId);

      if (!timeLog) {
        res.status(404).json({
          success: false,
          message: 'Time log not found'
        });
        return;
      }

      res.json({
        success: true,
        data: timeLog
      });
    } catch (error) {
      console.error('Get time log by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateTimeLog(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const userId = req.user!.id;
      const { id } = req.params;
      const updates = req.body;

      // Check if time log exists and belongs to user
      const existingLog = await this.timeLogModel.findById(id, userId);
      if (!existingLog) {
        res.status(404).json({
          success: false,
          message: 'Time log not found'
        });
        return;
      }

      const updatedTimeLog = await this.timeLogModel.update(id, userId, updates);

      if (!updatedTimeLog) {
        res.status(500).json({
          success: false,
          message: 'Failed to update time log'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedTimeLog,
        message: 'Time log updated successfully'
      });
    } catch (error) {
      console.error('Update time log error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteTimeLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if time log exists and belongs to user
      const existingLog = await this.timeLogModel.findById(id, userId);
      if (!existingLog) {
        res.status(404).json({
          success: false,
          message: 'Time log not found'
        });
        return;
      }

      const deleted = await this.timeLogModel.delete(id, userId);

      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete time log'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Time log deleted successfully'
      });
    } catch (error) {
      console.error('Delete time log error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTotalHours(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const totalHours = await this.timeLogModel.getTotalHoursByUser(userId);

      res.json({
        success: true,
        data: { totalHours }
      });
    } catch (error) {
      console.error('Get total hours error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getHoursByDateRange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const timeLogs = await this.timeLogModel.getHoursByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: timeLogs
      });
    } catch (error) {
      console.error('Get hours by date range error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
