import { BlobServiceClient, ContainerClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

export interface ExportOptions {
  format: 'csv' | 'excel';
  data: any[];
  filename?: string;
  expiresInMinutes?: number;
}

export interface ExportResult {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
  size: number;
}

class AzureBlobStorageService {
  private blobServiceClient!: BlobServiceClient;
  private containerClient!: ContainerClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'exports';

    if (!connectionString) {
      console.warn('⚠️ Azure Storage connection string not provided. Export functionality will be disabled.');
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    } catch (error) {
      console.error('❌ Failed to initialize Azure Blob Storage:', error);
    }
  }

  async initialize(): Promise<void> {
    if (!this.containerClient) return;

    try {
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'blob'
      });
      console.log(`✅ Azure Blob Storage container '${this.containerName}' initialized`);
    } catch (error) {
      console.error('❌ Failed to initialize Blob Storage container:', error);
    }
  }

  async exportData(options: ExportOptions): Promise<ExportResult> {
    if (!this.containerClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    const { format, data, filename, expiresInMinutes = 60 } = options;
    const fileId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFilename = filename || `ojtmeter-export-${timestamp}.${format}`;
    const blobName = `exports/${fileId}/${finalFilename}`;

    try {
      // Convert data to appropriate format
      let fileContent: string;
      let contentType: string;

      if (format === 'csv') {
        fileContent = this.convertToCSV(data);
        contentType = 'text/csv';
      } else if (format === 'excel') {
        fileContent = await this.convertToExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // Upload to blob storage
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(fileContent, fileContent.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobContentDisposition: `attachment; filename="${finalFilename}"`
        }
      });

      // Generate SAS URL for download
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      const sasUrl = await this.generateSASUrl(blobName, expiresAt);

      // Schedule cleanup
      this.scheduleCleanup(blobName, expiresAt);

      return {
        downloadUrl: sasUrl,
        filename: finalFilename,
        expiresAt,
        size: fileContent.length
      };
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private async convertToExcel(data: any[]): Promise<string> {
    // For now, return CSV format. In production, you'd use a library like 'xlsx'
    // to create actual Excel files
    const csvContent = this.convertToCSV(data);
    
    // Convert CSV to Excel-like format (simplified)
    // In a real implementation, you'd use the 'xlsx' library:
    // const workbook = XLSX.utils.book_new();
    // const worksheet = XLSX.utils.json_to_sheet(data);
    // XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    // return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return csvContent;
  }

  private async generateSASUrl(blobName: string, expiresAt: Date): Promise<string> {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
      throw new Error('Azure Storage account credentials not configured');
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const permissions = BlobSASPermissions.parse('r'); // Read permission

    const sasQueryParameters = generateBlobSASQueryParameters({
      containerName: this.containerName,
      blobName,
      permissions,
      expiresOn: expiresAt
    }, credential);

    const blobClient = this.containerClient.getBlobClient(blobName);
    return `${blobClient.url}?${sasQueryParameters.toString()}`;
  }

  private scheduleCleanup(blobName: string, expiresAt: Date): void {
    const cleanupTime = expiresAt.getTime() - Date.now();
    
    if (cleanupTime > 0) {
      setTimeout(async () => {
        try {
          const blobClient = this.containerClient.getBlobClient(blobName);
          await blobClient.deleteIfExists();
          console.log(`🗑️ Cleaned up expired export: ${blobName}`);
        } catch (error) {
          console.error('❌ Failed to cleanup expired export:', error);
        }
      }, cleanupTime);
    }
  }

  async cleanupExpiredExports(): Promise<void> {
    if (!this.containerClient) return;

    try {
      const now = new Date();
      const listOptions = {
        prefix: 'exports/'
      };

      for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
        if (blob.properties.createdOn && blob.properties.createdOn < now) {
          // Check if blob is older than 24 hours
          const ageInHours = (now.getTime() - blob.properties.createdOn.getTime()) / (1000 * 60 * 60);
          
          if (ageInHours > 24) {
            const blobClient = this.containerClient.getBlobClient(blob.name);
            await blobClient.deleteIfExists();
            console.log(`🗑️ Cleaned up old export: ${blob.name}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired exports:', error);
    }
  }

  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number }> {
    if (!this.containerClient) {
      return { totalFiles: 0, totalSize: 0 };
    }

    try {
      let totalFiles = 0;
      let totalSize = 0;

      for await (const blob of this.containerClient.listBlobsFlat()) {
        totalFiles++;
        totalSize += blob.properties.contentLength || 0;
      }

      return { totalFiles, totalSize };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
let blobStorageService: AzureBlobStorageService | null = null;

export const initializeBlobStorage = async (): Promise<AzureBlobStorageService | null> => {
  if (!blobStorageService) {
    blobStorageService = new AzureBlobStorageService();
    await blobStorageService.initialize();
  }
  return blobStorageService;
};

export const getBlobStorage = (): AzureBlobStorageService | null => {
  return blobStorageService;
};

export default AzureBlobStorageService;
