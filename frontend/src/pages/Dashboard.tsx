import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar as CalendarIcon, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { TimeLog, TimeLogRequest, Project } from '../types/index';
import { UserRole } from '../types/index';
import Charts from '../components/Charts';
import Calendar from '../components/Calendar';
import AdminDashboard from '../components/AdminDashboard';

interface DashboardStats {
  totalHours: number;
  recentLogs: TimeLog[];
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalHours: 0, recentLogs: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'admin'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [newTimeLog, setNewTimeLog] = useState<TimeLogRequest>({
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    description: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [totalHoursData, timeLogsData] = await Promise.all([
        apiService.getTotalHours(),
        apiService.getTimeLogs()
      ]);

      setStats({
        totalHours: totalHoursData.totalHours,
        recentLogs: timeLogsData.timeLogs
      });

      // Load projects for the dropdown
      try {
        const projectsData = await apiService.getAllProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Set empty array if projects fail to load
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createTimeLog(newTimeLog);
      setShowAddForm(false);
      setNewTimeLog({
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        description: ''
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error adding time log:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHours = (hours: number | undefined) => {
    if (typeof hours !== 'number' || isNaN(hours)) {
      return '0.0h';
    }
    return `${hours.toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OJTmeter Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex gap-3">
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
                <button
                  onClick={() => setActiveView(activeView === 'admin' ? 'dashboard' : 'admin')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Settings className="h-5 w-5" />
                  {activeView === 'admin' ? 'Dashboard' : 'Admin Panel'}
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Time Log
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{formatHours(stats.totalHours)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">0h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">0h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <Charts timeLogs={stats.recentLogs} totalHours={stats.totalHours} />

            {/* Calendar Section */}
            <div className="mb-8">
              <Calendar 
                timeLogs={stats.recentLogs}
                onDateClick={(date) => {
                  setNewTimeLog({ ...newTimeLog, date });
                  setShowAddForm(true);
                }}
                onEventClick={(event) => {
                  console.log('Event clicked:', event);
                }}
              />
            </div>

            {/* Recent Time Logs */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Time Logs</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentLogs.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No time logs yet. Add your first entry!</p>
                  </div>
                ) : (
                  stats.recentLogs.map((log) => (
                    <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-4">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(log.date)}</p>
                          <p className="text-sm text-gray-600">{log.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatHours(log.hours)}</p>
                        <p className="text-sm text-gray-600">{log.projectId || 'No project'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Time Log Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 mt-8 mb-8 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Time Log</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTimeLog}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newTimeLog.date}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value={newTimeLog.projectId || ''}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, projectId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    value={newTimeLog.hours}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, hours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newTimeLog.description}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
