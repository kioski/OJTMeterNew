export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projectIds?: string[];
}

export interface TimeLog {
  id: string;
  userId: string;
  projectId?: string;
  date: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  assignedUserIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  user: User;
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
  assignedUserIds: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TimeLogFilters {
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  recentLogs: TimeLog[];
}
