import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Settings, Clock, BarChart3, Calendar, Filter, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { User, Project, TimeLog } from '../types/index';
import { UserRole } from '../types/index';

interface AdminDashboardProps {
  onUserSelect?: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onUserSelect }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTimeLogs, setAllTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'reports' | 'timeLogs'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.USER,
    password: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    assignedUserIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, projectsData, timeLogsData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllProjects(),
        apiService.getAllTimeLogs()
      ]);
      
      setUsers(usersData);
      setProjects(projectsData);
      setAllTimeLogs(timeLogsData.timeLogs);
      
      console.log('Loaded users:', usersData);
      console.log('Loaded projects:', projectsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeLogs = async () => {
    try {
      const filters: any = {};
      if (selectedUser) filters.userId = selectedUser;
      if (dateFilter.startDate) filters.startDate = dateFilter.startDate;
      if (dateFilter.endDate) filters.endDate = dateFilter.endDate;
      
      const timeLogsData = await apiService.getAllTimeLogs(filters);
      setAllTimeLogs(timeLogsData.timeLogs);
    } catch (error) {
      console.error('Error loading time logs:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(userForm);
      setShowUserForm(false);
      resetUserForm();
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating project with data:', projectForm);
      console.log('Current user:', currentUser);
      console.log('User role:', currentUser?.role);
      
      // First test the endpoint
      console.log('Testing project creation endpoint...');
      await apiService.testProjectCreation(projectForm);
      
      // If test passes, try actual creation
      console.log('Test passed, creating actual project...');
      await apiService.createProject(projectForm);
      
      setShowProjectForm(false);
      resetProjectForm();
      loadData();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await apiService.updateProject(editingProject.id, projectForm);
        setShowProjectForm(false);
        resetProjectForm();
        loadData();
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await apiService.deleteProject(projectId);
        loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: ''
    });
    setShowUserForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      assignedUserIds: project.assignedUserIds
    });
    setShowProjectForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.deleteUser(userId);
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await apiService.toggleUserStatus(user.id);
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleCreateUserForTimeLog = async (log: any) => {
    const firstName = prompt('Enter first name for this user:');
    const lastName = prompt('Enter last name for this user:');
    const email = prompt('Enter email for this user:');
    
    if (firstName && lastName && email) {
      try {
        await apiService.createUser({
          email,
          firstName,
          lastName,
          role: UserRole.USER,
          password: 'temp123' // Temporary password, user should change it
        });
        loadData();
        alert('User created successfully! The user should change their password on first login.');
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please try again.');
      }
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.USER,
      password: ''
    });
    setEditingUser(null);
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      description: '',
      assignedUserIds: []
    });
    setEditingProject(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'projects' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('timeLogs')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'timeLogs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Time Logs
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <button
              onClick={() => setShowUserForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' :
                          user.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Project Management</h3>
            <button
              onClick={() => setShowProjectForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card">
                <h4 className="font-medium text-gray-900 mb-2">{project.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {project.assignedUsers ? project.assignedUsers.length : project.assignedUserIds?.length || 0} users assigned
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Logs Tab */}
      {activeTab === 'timeLogs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">All Time Logs</h3>
            <div className="flex gap-2">
              <button
                onClick={loadTimeLogs}
                className="btn-primary flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Time Logs Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Project</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTimeLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No time logs found
                      </td>
                    </tr>
                  ) : (
                    allTimeLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : (
                                <span className="text-red-600">
                                  Unknown User
                                  <span className="text-xs text-gray-500 ml-2">({log.userId})</span>
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {log.user ? log.user.email : (
                                <span className="text-red-500">User not found - ID: {log.userId}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-blue-600">{log.hours}h</span>
                        </td>
                        <td className="py-3 px-4">
                          {log.projectId ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {log.projectId}
                            </span>
                          ) : (
                            <span className="text-gray-400">No project</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs truncate">
                            {log.description || <span className="text-gray-400">No description</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit className="h-4 w-4" />
                            </button>
                            {!log.user && (
                              <button 
                                onClick={() => handleCreateUserForTimeLog(log)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Create user for this time log"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Reports & Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{projects.length}</div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allTimeLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Total Hours Logged</div>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={UserRole.USER}>Student/User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingUser}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    resetUserForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Users
                </label>
                <div className="space-y-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={projectForm.assignedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProjectForm({
                              ...projectForm,
                              assignedUserIds: [...projectForm.assignedUserIds, user.id]
                            });
                          } else {
                            setProjectForm({
                              ...projectForm,
                              assignedUserIds: projectForm.assignedUserIds.filter(id => id !== user.id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{user.firstName} {user.lastName} ({user.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    resetProjectForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
