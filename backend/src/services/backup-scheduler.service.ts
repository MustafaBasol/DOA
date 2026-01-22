import cron from 'node-cron';
import { backupService } from '../services/backup.service';

export class BackupScheduler {
  private dailyBackupJob: cron.ScheduledTask | null = null;
  private cleanupJob: cron.ScheduledTask | null = null;

  /**
   * Start automatic backup scheduler
   */
  start(): void {
    const backupEnabled = process.env.AUTO_BACKUP_ENABLED !== 'false';
    
    if (!backupEnabled) {
      console.log('⏸️  Automatic backups disabled');
      return;
    }

    // Daily backup at 2:00 AM
    const backupSchedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';
    this.dailyBackupJob = cron.schedule(backupSchedule, async () => {
      try {
        console.log('🕐 Running scheduled backup...');
        const backup = await backupService.createBackup('automatic');
        console.log(`✅ Scheduled backup completed: ${backup.filename}`);
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    });

    // Weekly cleanup on Sunday at 3:00 AM
    const cleanupSchedule = process.env.BACKUP_CLEANUP_SCHEDULE || '0 3 * * 0';
    const keepBackups = parseInt(process.env.BACKUP_KEEP_LAST || '30', 10);
    
    this.cleanupJob = cron.schedule(cleanupSchedule, async () => {
      try {
        console.log('🧹 Running backup cleanup...');
        const deleted = await backupService.cleanOldBackups(keepBackups);
        console.log(`✅ Cleanup completed: ${deleted} old backups deleted`);
      } catch (error) {
        console.error('❌ Backup cleanup failed:', error);
      }
    });

    console.log('⏰ Backup scheduler started');
    console.log(`📅 Daily backup: ${backupSchedule}`);
    console.log(`🧹 Weekly cleanup: ${cleanupSchedule} (keep last ${keepBackups})`);
  }

  /**
   * Stop scheduler
   */
  stop(): void {
    if (this.dailyBackupJob) {
      this.dailyBackupJob.stop();
      this.dailyBackupJob = null;
    }

    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
    }

    console.log('⏸️  Backup scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.dailyBackupJob !== null;
  }
}

export const backupScheduler = new BackupScheduler();
