import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../utils/auth';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    console.log('Authentication middleware - Headers:', req.headers.authorization);
    const token = AuthService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('Authentication middleware - No token found');
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    console.log('Authentication middleware - Token found, verifying...');
    const decoded = AuthService.verifyToken(token);
    console.log('Authentication middleware - Token verified, user:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Authentication middleware - Token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!AuthService.hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
export const requireSuperAdmin = requireRole([UserRole.SUPER_ADMIN]);

export const requireUserManagement = requirePermission('manage_users');
export const requireProjectManagement = requirePermission('manage_projects');
export const requireViewAllLogs = requirePermission('view_all_logs');
export const requireExportData = requirePermission('export_data');
