import { CosmosClient, Database, Container } from '@azure/cosmos';

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
}

class CosmosDBService {
  private client: CosmosClient;
  private database: Database | null = null;
  private containers: Map<string, Container> = new Map();

  constructor(config: CosmosConfig) {
    this.client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: process.env.COSMOS_DB_DATABASE_ID || 'ojtmeter-db',
      });
      
      this.database = database;
      console.log('✅ Cosmos DB database initialized');

      // Create containers
      await this.createContainers();
    } catch (error) {
      console.error('❌ Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  private async createContainers(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const containers = [
      {
        id: 'Users',
        partitionKey: '/id',
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent' as const,
          includedPaths: [
            { path: '/*' }
          ],
          excludedPaths: [
            { path: '/email/?' }
          ]
        }
      },
      {
        id: 'TimeLogs',
        partitionKey: '/userId',
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent' as const,
          includedPaths: [
            { path: '/*' }
          ]
        }
      },
      {
        id: 'Projects',
        partitionKey: '/id',
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent' as const,
          includedPaths: [
            { path: '/*' }
          ]
        }
      },
      {
        id: 'Roles',
        partitionKey: '/id',
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent' as const,
          includedPaths: [
            { path: '/*' }
          ]
        }
      }
    ];

    for (const containerConfig of containers) {
      try {
        const { container } = await this.database.containers.createIfNotExists(containerConfig);
        this.containers.set(containerConfig.id, container);
        console.log(`✅ Container '${containerConfig.id}' initialized`);
      } catch (error) {
        console.error(`❌ Failed to create container '${containerConfig.id}':`, error);
        throw error;
      }
    }
  }

  getContainer(containerName: string): Container {
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found`);
    }
    return container;
  }

  getClient(): CosmosClient {
    return this.client;
  }
}

// Mock database service for local development
class MockCosmosDBService {
  private containers: Map<string, any[]> = new Map();
  private static instance: MockCosmosDBService | null = null;

  async initialize(): Promise<void> {
    console.log('🔧 Using Mock Database for local development');
    console.log('⚠️  This is a development-only setup. For production, configure Azure Cosmos DB.');
    
    // Only initialize if containers are empty
    if (this.containers.size === 0) {
      // Initialize empty containers
      this.containers.set('Users', []);
      this.containers.set('TimeLogs', []);
      this.containers.set('Projects', []);
      this.containers.set('Roles', []);
      
      // Create a default admin user for testing
      const bcrypt = require('bcryptjs');
      const defaultAdmin = {
        id: 'user_admin_001',
        email: 'admin@ojtmeter.com',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectIds: []
      };
      
      this.containers.get('Users')!.push(defaultAdmin);
      
      console.log('✅ Mock database initialized with empty containers');
      console.log('👤 Default admin user created: admin@ojtmeter.com / admin123');
      console.log('👤 Admin user ID:', defaultAdmin.id);
      console.log('👤 Users in database:', this.containers.get('Users')!.map(u => ({ id: u.id, email: u.email })));
    } else {
      console.log('🔧 Mock database already initialized, preserving existing data');
      console.log('👤 Users in database:', this.containers.get('Users')!.map(u => ({ id: u.id, email: u.email })));
      console.log('📁 Projects in database:', this.containers.get('Projects')!.length);
      console.log('📝 Time logs in database:', this.containers.get('TimeLogs')!.length);
    }
  }

  getContainer(containerName: string): any {
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found`);
    }
    
    // Return a mock container with basic operations
    return {
      items: {
        create: async (item: any) => {
          // Don't override ID if it's already set
          const newItem = item.id ? item : { ...item, id: this.generateId() };
          container.push(newItem);
          return { resource: newItem };
        },
        query: (querySpec: any) => ({
          fetchAll: async () => {
            let results = [...container];
            
            // Simple filtering based on query
            if (querySpec.parameters) {
              for (const param of querySpec.parameters) {
                if (param.name === '@email') {
                  results = results.filter(item => item.email === param.value);
                } else if (param.name === '@userId') {
                  results = results.filter(item => item.userId === param.value);
                }
              }
            }
            
            return { resources: results };
          }
        })
      },
      item: (id: string, partitionKey?: string) => ({
        read: async () => {
          const item = container.find(item => item.id === id);
          return { resource: item || null };
        },
        replace: async (updatedItem: any) => {
          const index = container.findIndex(item => item.id === id);
          if (index !== -1) {
            container[index] = updatedItem;
            return { resource: updatedItem };
          }
          throw new Error('Item not found');
        },
        delete: async () => {
          const index = container.findIndex(item => item.id === id);
          if (index !== -1) {
            container.splice(index, 1);
            return { resource: { id } };
          }
          throw new Error('Item not found');
        }
      })
    };
  }

  getClient(): any {
    return this;
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let cosmosService: CosmosDBService | MockCosmosDBService | null = null;

export const initializeCosmosDB = async (): Promise<CosmosDBService | MockCosmosDBService> => {
  if (!cosmosService) {
    const config: CosmosConfig = {
      endpoint: process.env.COSMOS_DB_ENDPOINT || '',
      key: process.env.COSMOS_DB_KEY || '',
      databaseId: process.env.COSMOS_DB_DATABASE_ID || 'ojtmeter-db',
    };

    // Use mock service if Cosmos DB credentials are not provided or invalid
    if (!config.endpoint || !config.key || 
        config.endpoint.includes('your-cosmosdb') || 
        !config.endpoint.startsWith('https://') ||
        config.endpoint.length < 20) {
      console.log('🔧 No valid Cosmos DB credentials found, using mock database for development');
      cosmosService = new MockCosmosDBService();
    } else {
      cosmosService = new CosmosDBService(config);
    }
    
    await cosmosService.initialize();
  }
  return cosmosService;
};

export const getCosmosDB = (): CosmosDBService | MockCosmosDBService => {
  if (!cosmosService) {
    throw new Error('Cosmos DB not initialized. Call initializeCosmosDB() first.');
  }
  return cosmosService;
};

export default CosmosDBService;