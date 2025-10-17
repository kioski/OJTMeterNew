import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'ojtmeter-app',
      audience: 'ojtmeter-users'
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static hasPermission(userRole: UserRole, requiredPermission: string): boolean {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: [
        'manage_users',
        'manage_projects',
        'view_all_logs',
        'export_data',
        'manage_roles'
      ],
      [UserRole.ADMIN]: [
        'manage_users',
        'manage_projects',
        'view_all_logs',
        'export_data'
      ],
      [UserRole.USER]: [
        'view_own_logs',
        'create_logs',
        'edit_own_logs',
        'delete_own_logs'
      ]
    };

    return rolePermissions[userRole]?.includes(requiredPermission) || false;
  }

  static canAccessUserData(currentUser: User, targetUserId: string): boolean {
    // Super admins can access all user data
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Admins can access user data (but not super admin data)
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }
    
    // Users can only access their own data
    return currentUser.id === targetUserId;
  }

  static canAccessProjectData(currentUser: User, projectId?: string): boolean {
    // Super admins and admins can access all projects
    if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) {
      return true;
    }
    
    // Users can access projects they're assigned to
    if (projectId && currentUser.projectIds?.includes(projectId)) {
      return true;
    }
    
    return false;
  }
}
