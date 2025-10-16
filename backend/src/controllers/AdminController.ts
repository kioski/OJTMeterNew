import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/UserModel';
import { AuthService } from '../utils/auth';
import { UserRole, RegisterRequest, ApiResponse } from '../types';

export class AdminController {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  // Validation rules for creating users
  static createUserValidation = [
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
      .withMessage('Last name is required'),
    body('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role')
  ];

  // Get all users (admin only)
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userModel.findAll();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: usersWithoutPasswords
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create user (admin only)
  async createUser(req: Request, res: Response): Promise<void> {
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

      // Return response (exclude password)
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user (admin only)
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const { firstName, lastName, role, isActive } = req.body;

      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

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
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      const deleted = await this.userModel.delete(userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Toggle user status (admin only)
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userModel.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const updatedUser = await this.userModel.update(userId, { 
        isActive: !user.isActive 
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser!;

      res.json({
        success: true,
        data: userWithoutPassword,
        message: `User ${updatedUser!.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
