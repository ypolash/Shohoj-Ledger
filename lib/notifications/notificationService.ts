import { prisma } from "@/lib/prisma";

export interface SendNotificationParams {
  companyId: string;
  userId: string;
  category: string; // "SYSTEM", "HR", "PAYROLL", "PROJECTS", "CRM", "INVENTORY", "FINANCE"
  title: string;
  message: string;
  link?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  bypassPreferences?: boolean; // For critical security alerts
}

/**
 * Core event emitter for the Notification Center.
 * Checks user preferences and routes the message appropriately.
 */
export async function sendNotification({
  companyId,
  userId,
  category,
  title,
  message,
  link,
  priority = "NORMAL",
  bypassPreferences = false,
}: SendNotificationParams) {
  try {
    let shouldSendInApp = true;
    let shouldSendEmail = false;

    if (!bypassPreferences) {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { companyId_userId: { companyId, userId } }
      });

      if (prefs) {
        if (prefs.mutedCategories.includes(category)) {
          return null; // Silent drop if category is muted
        }
        shouldSendInApp = prefs.inAppEnabled;
        shouldSendEmail = prefs.emailEnabled;
        
        // Timezone / Working hours logic would go here
        // Digest mode logic would queue it instead of sending immediately
      }
    }

    if (shouldSendInApp) {
      const notification = await prisma.notification.create({
        data: {
          companyId,
          userId,
          category,
          title,
          message,
          link,
          priority,
          channel: "IN_APP",
        }
      });
      return notification;
    }

    // Future: if (shouldSendEmail) queueEmailService(...)

    return null;
  } catch (error) {
    console.error("sendNotification Error:", error);
    return null; // Fail silently so it doesn't crash the main execution block
  }
}
