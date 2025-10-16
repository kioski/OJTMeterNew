export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectIds?: string[];
}

export interface TimeLog {
  id: string;
  userId: string;
  projectId?: string;
  date: Date;
  hours: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  assignedUserIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum Permission {
  MANAGE_USERS = 'manage_users',
  MANAGE_PROJECTS = 'manage_projects',
  VIEW_ALL_LOGS = 'view_all_logs',
  EXPORT_DATA = 'export_data',
  MANAGE_ROLES = 'manage_roles'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface TimeLogRequest {
  projectId?: string;
  date: string;
  hours: number;
  description?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  assignedUserIds?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TimeLogFilters {
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}
