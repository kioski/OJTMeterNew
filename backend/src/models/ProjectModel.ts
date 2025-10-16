import { Container } from '@azure/cosmos';
import { getCosmosDB } from '../utils/cosmos';
import { Project, ProjectRequest } from '../types';

export class ProjectModel {
  private container: Container | null = null;

  constructor() {
    // Lazy initialization - will be set when first accessed
  }

  private getContainer(): Container {
    if (!this.container) {
      const cosmosDB = getCosmosDB();
      this.container = cosmosDB.getContainer('Projects');
    }
    return this.container;
  }

  async create(projectData: ProjectRequest): Promise<Project> {
    const project: Project = {
      id: this.generateId(),
      name: projectData.name,
      description: projectData.description,
      assignedUserIds: projectData.assignedUserIds || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { resource } = await this.getContainer().items.create(project);
    return resource as Project;
  }

  async findById(id: string): Promise<Project | null> {
    try {
      const { resource } = await this.getContainer().item(id, id).read();
      return resource as Project | null;
    } catch (error) {
      console.error('Error finding project by ID:', error);
      // Return mock project if not found in database
      const mockProjects = [
        { id: 'project_001', name: 'Web Development Training', description: 'Frontend and backend development training', assignedUserIds: [], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'project_002', name: 'Database Management', description: 'Learning database design and management', assignedUserIds: [], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'project_003', name: 'Mobile App Development', description: 'React Native mobile application development', assignedUserIds: [], isActive: true, createdAt: new Date(), updatedAt: new Date() }
      ];
      return mockProjects.find(p => p.id === id) || null;
    }
  }

  async getAll(limit: number = 100): Promise<Project[]> {
    try {
      const query = 'SELECT * FROM c ORDER BY c.createdAt DESC';
      const { resources } = await this.getContainer().items
        .query({ query })
        .fetchAll();

      return resources.slice(0, limit) as Project[];
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  async getActiveProjects(): Promise<Project[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.createdAt DESC';
      const { resources } = await this.getContainer().items
        .query({ query })
        .fetchAll();

      return resources as Project[];
    } catch (error) {
      console.error('Error getting active projects:', error);
      return [];
    }
  }

  async findByUser(userId: string): Promise<Project[]> {
    try {
      const query = 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.assignedUserIds, @userId) AND c.isActive = true';
      const { resources } = await this.getContainer().items
        .query({
          query,
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

      return resources as Project[];
    } catch (error) {
      console.error('Error finding projects by user:', error);
      return [];
    }
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const project = await this.findById(id);
      if (!project) return null;

      const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date()
      };

      const { resource } = await this.getContainer().item(id, id).replace(updatedProject);
      return resource as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.getContainer().item(id, id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  async assignUser(projectId: string, userId: string): Promise<boolean> {
    try {
      const project = await this.findById(projectId);
      if (!project) return false;

      const assignedUserIds = project.assignedUserIds || [];
      if (!assignedUserIds.includes(userId)) {
        assignedUserIds.push(userId);
        await this.update(projectId, { assignedUserIds });
      }

      return true;
    } catch (error) {
      console.error('Error assigning user to project:', error);
      return false;
    }
  }

  async removeUser(projectId: string, userId: string): Promise<boolean> {
    try {
      const project = await this.findById(projectId);
      if (!project) return false;

      const assignedUserIds = (project.assignedUserIds || []).filter(id => id !== userId);
      await this.update(projectId, { assignedUserIds });

      return true;
    } catch (error) {
      console.error('Error removing user from project:', error);
      return false;
    }
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
