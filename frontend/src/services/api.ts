import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  TimeLogRequest, 
  TimeLog, 
  User, 
  Project,
  ApiResponse,
  TimeLogFilters 
} from '../types/index';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register', userData);
    return response.data.data!;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/profile');
    return response.data.data!;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/auth/profile', updates);
    return response.data.data!;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/auth/change-password', { currentPassword, newPassword });
  }

  // Time log endpoints
  async createTimeLog(timeLogData: TimeLogRequest): Promise<TimeLog> {
    const response: AxiosResponse<ApiResponse<TimeLog>> = await this.api.post('/time-logs', timeLogData);
    return response.data.data!;
  }

  async getTimeLogs(filters?: TimeLogFilters): Promise<{ timeLogs: TimeLog[]; totalHours: number }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    
    const response: AxiosResponse<ApiResponse<{ timeLogs: TimeLog[]; totalHours: number }>> = 
      await this.api.get(`/time-logs?${params.toString()}`);
    return response.data.data!;
  }

  async getTimeLogById(id: string): Promise<TimeLog> {
    const response: AxiosResponse<ApiResponse<TimeLog>> = await this.api.get(`/time-logs/${id}`);
    return response.data.data!;
  }

  async updateTimeLog(id: string, updates: Partial<TimeLogRequest>): Promise<TimeLog> {
    const response: AxiosResponse<ApiResponse<TimeLog>> = await this.api.put(`/time-logs/${id}`, updates);
    return response.data.data!;
  }

  async deleteTimeLog(id: string): Promise<void> {
    await this.api.delete(`/time-logs/${id}`);
  }

  async getTotalHours(): Promise<{ totalHours: number }> {
    const response: AxiosResponse<ApiResponse<{ totalHours: number }>> = await this.api.get('/time-logs/total-hours');
    return response.data.data!;
  }

  async getHoursByDateRange(startDate: string, endDate: string): Promise<TimeLog[]> {
    const response: AxiosResponse<ApiResponse<TimeLog[]>> = await this.api.get(
      `/time-logs/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data!;
  }

  // Admin endpoints
  async getAllUsers(): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.api.get('/admin/users');
    return response.data.data!;
  }

  async createUser(userData: RegisterRequest): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/admin/users', userData);
    return response.data.data!;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/admin/users/${userId}`, updates);
    return response.data.data!;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/admin/users/${userId}`);
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data.data!;
  }

  // Admin endpoints for viewing all logs
  async getAllTimeLogs(filters?: TimeLogFilters): Promise<{ timeLogs: TimeLog[]; totalHours: number }> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    
    const response: AxiosResponse<ApiResponse<{ timeLogs: TimeLog[]; totalHours: number }>> = 
      await this.api.get(`/admin/time-logs?${params.toString()}`);
    return response.data.data!;
  }

  async getTimeLogsByUser(userId: string, filters?: TimeLogFilters): Promise<{ timeLogs: TimeLog[]; totalHours: number }> {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    
    const response: AxiosResponse<ApiResponse<{ timeLogs: TimeLog[]; totalHours: number }>> = 
      await this.api.get(`/admin/time-logs?${params.toString()}`);
    return response.data.data!;
  }

  // Project endpoints
  async getAllProjects(): Promise<Project[]> {
    try {
      // Try to get projects from backend first
      const response: AxiosResponse<ApiResponse<Project[]>> = await this.api.get('/admin/projects');
      return response.data.data!;
    } catch (error) {
      console.error('Error fetching projects from backend, using mock data:', error);
      // Fallback to mock projects if backend fails
      return [
        { id: 'project_001', name: 'Web Development Training', description: 'Frontend and backend development training', assignedUserIds: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'project_002', name: 'Database Management', description: 'Learning database design and management', assignedUserIds: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'project_003', name: 'Mobile App Development', description: 'React Native mobile application development', assignedUserIds: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
    }
  }

  async testProjectCreation(projectData: Partial<Project>): Promise<unknown> {
    console.log('API Service - Testing project creation with data:', projectData);
    // Temporarily disable auth for testing
    const response: AxiosResponse<ApiResponse<unknown>> = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/projects/test`, 
      projectData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('API Service - Test project creation response:', response.data);
    return response.data.data!;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    console.log('API Service - Creating project with data:', projectData);
    const response: AxiosResponse<ApiResponse<Project>> = await this.api.post('/admin/projects', projectData);
    console.log('API Service - Project creation response:', response.data);
    return response.data.data!;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const response: AxiosResponse<ApiResponse<Project>> = await this.api.put(`/admin/projects/${projectId}`, updates);
    return response.data.data!;
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.api.delete(`/admin/projects/${projectId}`);
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;
