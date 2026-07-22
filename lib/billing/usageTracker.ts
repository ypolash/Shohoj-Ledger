import { prisma } from "@/lib/prisma";
import { getPlanLimits, SubscriptionTier } from "./plans";

/**
 * Service to track current resource usage against the defined limits of a company's tier.
 */
export class UsageTracker {
  
  /**
   * Evaluates if a company can add more users.
   */
  static async checkUserLimit(companyId: string, currentTier: SubscriptionTier): Promise<boolean> {
    const limits = getPlanLimits(currentTier);
    if (limits.maxUsers >= 999999) return true; // Unlimited

    const userCount = await prisma.user.count({
      where: { companyId }
    });

    return userCount < limits.maxUsers;
  }

  /**
   * Evaluates if a company can create a new project.
   */
  static async checkProjectLimit(companyId: string, currentTier: SubscriptionTier): Promise<boolean> {
    const limits = getPlanLimits(currentTier);
    if (limits.maxProjects >= 999999) return true;

    const projectCount = await prisma.project.count({
      where: { companyId }
    });

    return projectCount < limits.maxProjects;
  }

  /**
   * Evaluates if a company can add more clients/leads.
   */
  static async checkClientLimit(companyId: string, currentTier: SubscriptionTier): Promise<boolean> {
    const limits = getPlanLimits(currentTier);
    if (limits.maxClients >= 999999) return true;

    const leadCount = await prisma.lead.count({
      where: { companyId }
    });

    return leadCount < limits.maxClients;
  }

  // maxStorageMB would ideally check an S3 bucket metric or sum of uploaded file sizes.
}
