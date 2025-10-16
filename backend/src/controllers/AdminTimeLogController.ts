import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { TimeLogModel } from '../models/TimeLogModel';
import { UserModel } from '../models/UserModel';
import { AuthenticatedRequest, TimeLogFilters, ApiResponse } from '../types';

export class AdminTimeLogController {
  private timeLogModel: TimeLogModel;
  private userModel: UserModel;

  constructor() {
    this.timeLogModel = new TimeLogModel();
    this.userModel = new UserModel();
  }

  // Validation rules
  static queryValidation = [
    query('userId')
      .optional()
      .isString()
      .withMessage('User ID must be a string'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('projectId')
      .optional()
      .isString()
      .withMessage('Project ID must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000')
  ];

  // Get all time logs (admin only)
  async getAllTimeLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { userId, startDate, endDate, projectId, limit = 100 } = req.query;

      const filters: TimeLogFilters = {
        userId: userId as string,
        projectId: projectId as string,
        startDate: startDate as string,
        endDate: endDate as string
      };

      // Get all time logs with filters
      const timeLogs = await this.timeLogModel.findByFilters(filters, Number(limit));
      
      // Calculate total hours across all logs
      const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

      // Get user information for each log
      const logsWithUserInfo = await Promise.all(
        timeLogs.map(async (log) => {
          const user = await this.userModel.findById(log.userId);
          return {
            ...log,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          timeLogs: logsWithUserInfo,
          totalHours,
          pagination: {
            limit: Number(limit),
            total: timeLogs.length
          }
        }
      });
    } catch (error) {
      console.error('Get all time logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get time logs by specific user (admin only)
  async getTimeLogsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate, projectId, limit = 100 } = req.query;

      // Verify user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

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
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          pagination: {
            limit: Number(limit),
            total: timeLogs.length
          }
        }
      });
    } catch (error) {
      console.error('Get time logs by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get summary statistics (admin only)
  async getSummaryStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters: TimeLogFilters = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      const timeLogs = await this.timeLogModel.findByFilters(filters, 1000);
      const users = await this.userModel.findAll();

      // Calculate statistics
      const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
      const activeUsers = users.filter(user => user.isActive).length;
      const totalLogs = timeLogs.length;

      // Group by user
      const userStats = users.map(user => {
        const userLogs = timeLogs.filter(log => log.userId === user.id);
        const userHours = userLogs.reduce((sum, log) => sum + log.hours, 0);
        return {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          totalHours: userHours,
          logCount: userLogs.length,
          isActive: user.isActive
        };
      });

      res.json({
        success: true,
        data: {
          summary: {
            totalHours,
            totalLogs,
            activeUsers,
            totalUsers: users.length
          },
          userStats: userStats.sort((a, b) => b.totalHours - a.totalHours)
        }
      });
    } catch (error) {
      console.error('Get summary stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
