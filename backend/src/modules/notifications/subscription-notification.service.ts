import { PrismaClient } from '@prisma/client';
import { emailService } from '../notifications/email.service';
import { serverConfig } from '../../config';

const prisma = new PrismaClient();

/**
 * Check for subscriptions expiring soon and send email notifications
 */
export class SubscriptionNotificationService {
  /**
   * Check and notify for subscriptions expiring in the next N days
   */
  async checkExpiringSubscriptions() {
    try {
      const now = new Date();
      const days = [7, 3, 1]; // Check for 7, 3, and 1 day before expiry

      for (const daysRemaining of days) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysRemaining);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find active subscriptions expiring on target date
        const expiringSubscriptions = await prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: targetDate,
              lt: nextDay,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                companyName: true,
              },
            },
          },
        });

        console.log(`📅 Found ${expiringSubscriptions.length} subscriptions expiring in ${daysRemaining} days`);

        // Send email notifications
        for (const subscription of expiringSubscriptions) {
          if (subscription.user.email && subscription.endDate) {
            try {
              await emailService.sendSubscriptionExpiryWarning({
                to: subscription.user.email,
                userName: subscription.user.fullName || subscription.user.companyName || subscription.user.email,
                planName: subscription.planName,
                expiryDate: subscription.endDate,
                daysRemaining,
                renewUrl: `${serverConfig.frontendUrl}/client.html`,
              });

              console.log(`📧 Expiry notification sent to ${subscription.user.email} (${daysRemaining} days)`);
            } catch (error) {
              console.error(`❌ Failed to send expiry email to ${subscription.user.email}:`, error);
            }
          }
        }
      }

      // Update expired subscriptions
      await this.updateExpiredSubscriptions();

    } catch (error) {
      console.error('❌ Error checking expiring subscriptions:', error);
    }
  }

  /**
   * Update subscriptions that have expired
   */
  async updateExpiredSubscriptions() {
    try {
      const now = new Date();

      const result = await prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: now,
          },
        },
        data: {
          status: 'CANCELLED', // or 'EXPIRED' if you add this status
        },
      });

      if (result.count > 0) {
        console.log(`⏰ Updated ${result.count} expired subscriptions`);
      }
    } catch (error) {
      console.error('❌ Error updating expired subscriptions:', error);
    }
  }

  /**
   * Start the scheduler (runs every hour)
   */
  startScheduler() {
    console.log('⏱️  Subscription notification scheduler started');

    // Run immediately on start
    this.checkExpiringSubscriptions();

    // Run every hour
    setInterval(() => {
      this.checkExpiringSubscriptions();
    }, 60 * 60 * 1000); // 1 hour
  }
}

export const subscriptionNotificationService = new SubscriptionNotificationService();
