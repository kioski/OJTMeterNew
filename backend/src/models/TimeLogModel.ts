import { Container } from '@azure/cosmos';
import { getCosmosDB } from '../utils/cosmos';
import { TimeLog, TimeLogRequest, TimeLogFilters } from '../types';

export class TimeLogModel {
  private container: Container | null = null;

  constructor() {
    // Lazy initialization - will be set when first accessed
  }

  private getContainer(): Container {
    if (!this.container) {
      const cosmosDB = getCosmosDB();
      this.container = cosmosDB.getContainer('TimeLogs');
    }
    return this.container;
  }

  async create(userId: string, timeLogData: TimeLogRequest): Promise<TimeLog> {
    const timeLog: TimeLog = {
      id: this.generateId(),
      userId,
      projectId: timeLogData.projectId,
      date: new Date(timeLogData.date),
      hours: timeLogData.hours,
      description: timeLogData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { resource } = await this.getContainer().items.create(timeLog);
    return resource as TimeLog;
  }

  async findById(id: string, userId: string): Promise<TimeLog | null> {
    try {
      const { resource } = await this.getContainer().item(id, userId).read();
      return resource as TimeLog | null;
    } catch (error) {
      console.error('Error finding time log by ID:', error);
      return null;
    }
  }

  async findByUser(userId: string, limit: number = 100): Promise<TimeLog[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

      return resources.slice(0, limit) as TimeLog[];
    } catch (error) {
      console.error('Error finding time logs by user:', error);
      return [];
    }
  }

  async findByProject(projectId: string, limit: number = 100): Promise<TimeLog[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.projectId = @projectId ORDER BY c.date DESC';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [{ name: '@projectId', value: projectId }]
        })
        .fetchAll();

      return resources.slice(0, limit) as TimeLog[];
    } catch (error) {
      console.error('Error finding time logs by project:', error);
      return [];
    }
  }

  async findByFilters(filters: TimeLogFilters, limit: number = 100): Promise<TimeLog[]> {
    try {
      let query = 'SELECT * FROM c WHERE 1=1';
      const parameters: any[] = [];

      if (filters.userId) {
        query += ' AND c.userId = @userId';
        parameters.push({ name: '@userId', value: filters.userId });
      }

      if (filters.projectId) {
        query += ' AND c.projectId = @projectId';
        parameters.push({ name: '@projectId', value: filters.projectId });
      }

      if (filters.startDate) {
        query += ' AND c.date >= @startDate';
        parameters.push({ name: '@startDate', value: new Date(filters.startDate) });
      }

      if (filters.endDate) {
        query += ' AND c.date <= @endDate';
        parameters.push({ name: '@endDate', value: new Date(filters.endDate) });
      }

      query += ' ORDER BY c.date DESC';

      const { resources } = await this.getContainer().items
        .query({ query, parameters })
        .fetchAll();

      return resources.slice(0, limit) as TimeLog[];
    } catch (error) {
      console.error('Error finding time logs by filters:', error);
      return [];
    }
  }

  async update(id: string, userId: string, updates: Partial<TimeLog>): Promise<TimeLog | null> {
    try {
      const timeLog = await this.findById(id, userId);
      if (!timeLog) return null;

      const updatedTimeLog = {
        ...timeLog,
        ...updates,
        updatedAt: new Date()
      };

      const { resource } = await this.getContainer().item(id, userId).replace(updatedTimeLog);
      return resource as TimeLog;
    } catch (error) {
      console.error('Error updating time log:', error);
      return null;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await this.getContainer().item(id, userId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting time log:', error);
      return false;
    }
  }

  async getTotalHoursByUser(userId: string): Promise<number> {
    try {
      const query = 'SELECT VALUE SUM(c.hours) FROM c WHERE c.userId = @userId';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

      return resources[0] || 0;
    } catch (error) {
      console.error('Error getting total hours by user:', error);
      return 0;
    }
  }

  async getTotalHoursByProject(projectId: string): Promise<number> {
    try {
      const query = 'SELECT VALUE SUM(c.hours) FROM c WHERE c.projectId = @projectId';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [{ name: '@projectId', value: projectId }]
        })
        .fetchAll();

      return resources[0] || 0;
    } catch (error) {
      console.error('Error getting total hours by project:', error);
      return 0;
    }
  }

  async getHoursByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TimeLog[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.userId = @userId AND c.date >= @startDate AND c.date <= @endDate ORDER BY c.date ASC';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [
            { name: '@userId', value: userId },
            { name: '@startDate', value: startDate },
            { name: '@endDate', value: endDate }
          ]
        })
        .fetchAll();

      return resources as TimeLog[];
    } catch (error) {
      console.error('Error getting hours by date range:', error);
      return [];
    }
  }

  private generateId(): string {
    return `timelog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
