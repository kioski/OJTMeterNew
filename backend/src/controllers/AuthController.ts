import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/UserModel';
import { AuthService } from '../utils/auth';
import { RegisterRequest, LoginRequest, ApiResponse, AuthResponse, UserRole } from '../types';

export class AuthController {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  // Validation rules
  static registerValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('firstName')
      .trim()
      .isLength({ min: 1 })
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Last name is required')
  ];

  static loginValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];

  async register(req: Request, res: Response): Promise<void> {
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

      const { email, password, firstName, lastName, role }: RegisterRequest = req.body;

      // Validate email format
      if (!AuthService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create user
      const userData: RegisterRequest = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || UserRole.USER
      };

      const user = await this.userModel.create(userData);

      // Generate token
      const token = AuthService.generateToken(user);

      // Return response (exclude password)
      const { password: _, ...userWithoutPassword } = user;
      const response: AuthResponse = {
        token,
        user: userWithoutPassword
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
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

      const { email, password }: LoginRequest = req.body;

      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await AuthService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Generate token
      const token = AuthService.generateToken(user);

      // Return response (exclude password)
      const { password: _, ...userWithoutPassword } = user;
      const response: AuthResponse = {
        token,
        user: userWithoutPassword
      };

      res.json({
        success: true,
        data: response,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      console.log('Get profile - User ID from token:', userId);
      const user = await this.userModel.findById(userId);
      console.log('Get profile - User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('Get profile - User not found in database');
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { firstName, lastName } = req.body;

      const updates: any = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;

      const updatedUser = await this.userModel.update(userId, updates);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: userWithoutPassword,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate new password
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'New password does not meet requirements',
          errors: passwordValidation.errors
        });
        return;
      }

      // Get current user
      const user = await this.userModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await AuthService.hashPassword(newPassword);

      // Update password
      const updatedUser = await this.userModel.update(userId, { password: hashedNewPassword });

      if (!updatedUser) {
        res.status(500).json({
          success: false,
          message: 'Failed to update password'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async createFirstAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if any admin already exists
      const existingAdmins = await this.userModel.getUsersByRole(UserRole.ADMIN);
      const existingSuperAdmins = await this.userModel.getUsersByRole(UserRole.SUPER_ADMIN);
      
      if (existingAdmins.length > 0 || existingSuperAdmins.length > 0) {
        res.status(403).json({
          success: false,
          message: 'Admin users already exist. This endpoint is only for creating the first admin.'
        });
        return;
      }

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      // Validate email format
      if (!AuthService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create super admin user
      const userData: RegisterRequest = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.SUPER_ADMIN
      };

      const user = await this.userModel.create(userData);

      // Generate token
      const token = AuthService.generateToken(user);

      // Return response (exclude password)
      const { password: _, ...userWithoutPassword } = user;
      const response: AuthResponse = {
        token,
        user: userWithoutPassword
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'First admin user created successfully'
      });
    } catch (error) {
      console.error('Create first admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
