import { Container, ItemResponse } from '@azure/cosmos';
import { getCosmosDB } from '../utils/cosmos';
import { User, UserRole, RegisterRequest } from '../types';

export class UserModel {
  private container: Container;

  constructor() {
    const cosmosDB = getCosmosDB();
    this.container = cosmosDB.getContainer('Users');
  }

  async create(userData: RegisterRequest): Promise<User> {
    const user: User = {
      id: this.generateId(),
      email: userData.email.toLowerCase(),
      password: userData.password, // Will be hashed before saving
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectIds: []
    };

    const { resource } = await this.container.items.create(user);
    return resource as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM c WHERE c.email = @email';
      const { resources } = await this.container.items
        .query({
          query,
          parameters: [{ name: '@email', value: email.toLowerCase() }]
        })
        .fetchAll();

      return resources.length > 0 ? resources[0] as User : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      console.log('Searching for user with ID:', id);
      const { resource } = await this.container.item(id, id).read();
      console.log('Found user:', resource);
      return resource as User | null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const user = await this.findById(id);
      if (!user) return null;

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date()
      };

      const { resource } = await this.container.item(id, id).replace(updatedUser);
      return resource as User;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const query = 'SELECT * FROM c ORDER BY c.createdAt DESC';
      const { resources } = await this.container.items
        .query({ query })
        .fetchAll();

      return resources as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAll(limit: number = 100): Promise<User[]> {
    try {
      const query = 'SELECT * FROM c ORDER BY c.createdAt DESC';
      const { resources } = await this.container.items
        .query({ query })
        .fetchAll();

      return resources.slice(0, limit) as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const query = 'SELECT * FROM c WHERE c.role = @role ORDER BY c.createdAt DESC';
      const { resources } = await this.container.items
        .query({
          query,
          parameters: [{ name: '@role', value: role }]
        })
        .fetchAll();

      return resources as User[];
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  async assignToProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      const projectIds = user.projectIds || [];
      if (!projectIds.includes(projectId)) {
        projectIds.push(projectId);
        await this.update(userId, { projectIds });
      }

      return true;
    } catch (error) {
      console.error('Error assigning user to project:', error);
      return false;
    }
  }

  async removeFromProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      const projectIds = (user.projectIds || []).filter(id => id !== projectId);
      await this.update(userId, { projectIds });

      return true;
    } catch (error) {
      console.error('Error removing user from project:', error);
      return false;
    }
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
