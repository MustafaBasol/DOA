import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../config/database';

const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
  tables?: string[];
}

export class BackupService {
  private backupDir: string;
  
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  /**
   * Backup klasörünün var olduğundan emin ol
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Tam database backup oluştur (PostgreSQL pg_dump)
   */
  async createBackup(type: 'manual' | 'automatic' = 'manual'): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse database URL
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    try {
      // Set password environment variable for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: dbPassword,
      };

      // Execute pg_dump
      const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filepath}"`;
      
      await execAsync(command, { env, maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer

      // Get file size
      const stats = await fs.stat(filepath);

      const metadata: BackupMetadata = {
        id: timestamp,
        filename,
        size: stats.size,
        createdAt: new Date(),
        type,
        status: 'completed',
      };

      // Log backup to database
      await this.logBackup(metadata);

      console.log(`✅ Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      return metadata;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      
      const metadata: BackupMetadata = {
        id: timestamp,
        filename,
        size: 0,
        createdAt: new Date(),
        type,
        status: 'failed',
      };

      await this.logBackup(metadata);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Specific tables backup
   */
  async createTableBackup(tables: string[], type: 'manual' | 'automatic' = 'manual'): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-tables-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    try {
      const env = {
        ...process.env,
        PGPASSWORD: dbPassword,
      };

      // Build table list for pg_dump
      const tableArgs = tables.map(t => `-t ${t}`).join(' ');
      const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} ${tableArgs} -F p -f "${filepath}"`;

      await execAsync(command, { env, maxBuffer: 1024 * 1024 * 50 });

      const stats = await fs.stat(filepath);

      const metadata: BackupMetadata = {
        id: timestamp,
        filename,
        size: stats.size,
        createdAt: new Date(),
        type,
        status: 'completed',
        tables,
      };

      await this.logBackup(metadata);

      console.log(`✅ Table backup created: ${filename} (${tables.join(', ')})`);

      return metadata;
    } catch (error) {
      console.error('❌ Table backup failed:', error);
      throw new Error(`Table backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backups = await this.listBackups();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      throw new Error('Backup not found');
    }

    const filepath = path.join(this.backupDir, backup.filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      throw new Error('Backup file not found on disk');
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    try {
      const env = {
        ...process.env,
        PGPASSWORD: dbPassword,
      };

      // Drop and recreate database (use with caution!)
      console.log('⚠️  Dropping existing database...');
      await execAsync(`dropdb -h ${dbHost} -p ${dbPort} -U ${dbUser} --if-exists ${dbName}`, { env });
      
      console.log('📦 Creating fresh database...');
      await execAsync(`createdb -h ${dbHost} -p ${dbPort} -U ${dbUser} ${dbName}`, { env });

      // Restore from backup
      console.log('♻️  Restoring from backup...');
      const command = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`;
      await execAsync(command, { env, maxBuffer: 1024 * 1024 * 50 });

      console.log(`✅ Database restored from: ${backup.filename}`);
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          
          // Parse timestamp from filename
          const timestampMatch = file.match(/backup(?:-tables)?-(.+)\.sql/);
          const id = timestampMatch ? timestampMatch[1] : file;

          backups.push({
            id,
            filename: file,
            size: stats.size,
            createdAt: stats.mtime,
            type: 'manual', // Can't determine from filename
            status: 'completed',
          });
        }
      }

      // Sort by creation date (newest first)
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backups = await this.listBackups();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      throw new Error('Backup not found');
    }

    const filepath = path.join(this.backupDir, backup.filename);

    try {
      await fs.unlink(filepath);
      console.log(`✅ Backup deleted: ${backup.filename}`);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup file');
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }> {
    const backups = await this.listBackups();

    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const dates = backups.map(b => b.createdAt);
    const oldestBackup = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestBackup = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup,
      newestBackup,
    };
  }

  /**
   * Clean old backups (keep last N backups)
   */
  async cleanOldBackups(keepLast: number = 7): Promise<number> {
    const backups = await this.listBackups();

    if (backups.length <= keepLast) {
      return 0;
    }

    const toDelete = backups.slice(keepLast);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    console.log(`🧹 Cleaned ${deletedCount} old backups (kept last ${keepLast})`);

    return deletedCount;
  }

  /**
   * Log backup to database (optional, requires BackupLog model)
   */
  private async logBackup(metadata: BackupMetadata): Promise<void> {
    // This would require a BackupLog table in Prisma schema
    // For now, just console log
    console.log('📝 Backup logged:', {
      id: metadata.id,
      filename: metadata.filename,
      size: `${(metadata.size / 1024 / 1024).toFixed(2)} MB`,
      type: metadata.type,
      status: metadata.status,
    });
  }

  /**
   * Health check - verify pg_dump is available
   */
  async healthCheck(): Promise<{ available: boolean; version?: string }> {
    try {
      const { stdout } = await execAsync('pg_dump --version');
      return {
        available: true,
        version: stdout.trim(),
      };
    } catch {
      return {
        available: false,
      };
    }
  }
}

export const backupService = new BackupService();
