import { SubscriptionTier, SUBSCRIPTION_PLANS } from "./plans";

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELED";

export interface CompanySubscriptionState {
  companyId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodEndsAt: Date | null;
}

/**
 * Service to manage the lifecycle of a Company's Subscription.
 * Note: Database schema integrations are deferred to a future phase.
 * This class abstracts the foundational logic for billing and suspension.
 */
export class SubscriptionService {
  private static TRIAL_DAYS = 14;
  private static GRACE_PERIOD_DAYS = 7;

  /**
   * Initializes a brand new subscription for a recently signed-up company.
   * Defaults to a 14-day Free Trial of the PRO tier.
   */
  static initializeTrial(companyId: string): CompanySubscriptionState {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + this.TRIAL_DAYS);

    return {
      companyId,
      tier: "PRO",
      status: "TRIAL",
      trialEndsAt: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      gracePeriodEndsAt: null,
    };
  }

  /**
   * Evaluates the active status of a subscription, automatically updating
   * to PAST_DUE or SUSPENDED based on the grace period.
   */
  static evaluateStatus(sub: CompanySubscriptionState): SubscriptionStatus {
    const now = new Date();

    if (sub.status === "CANCELED") return "CANCELED";
    if (sub.status === "SUSPENDED") return "SUSPENDED";

    // Trial check
    if (sub.status === "TRIAL") {
      if (sub.trialEndsAt && now > sub.trialEndsAt) {
        return "PAST_DUE";
      }
      return "TRIAL";
    }

    // Active subscription check
    if (now > sub.currentPeriodEnd) {
      // If we are past the period, are we in the grace period?
      if (!sub.gracePeriodEndsAt) {
        return "PAST_DUE"; // Grace period should have been set by the billing cron
      }
      
      if (now > sub.gracePeriodEndsAt) {
        return "SUSPENDED";
      }
      
      return "PAST_DUE";
    }

    return "ACTIVE";
  }

  /**
   * Called when a payment fails. Activates the 7-day grace period.
   */
  static handlePaymentFailure(sub: CompanySubscriptionState): CompanySubscriptionState {
    const now = new Date();
    const graceEnd = new Date();
    graceEnd.setDate(now.getDate() + this.GRACE_PERIOD_DAYS);

    return {
      ...sub,
      status: "PAST_DUE",
      gracePeriodEndsAt: graceEnd
    };
  }

  /**
   * Called upon successful payment to renew the billing cycle.
   */
  static handlePaymentSuccess(sub: CompanySubscriptionState, tier: SubscriptionTier, monthly: boolean): CompanySubscriptionState {
    const now = new Date();
    const nextEnd = new Date();
    
    if (monthly) {
      nextEnd.setMonth(now.getMonth() + 1);
    } else {
      nextEnd.setFullYear(now.getFullYear() + 1);
    }

    return {
      ...sub,
      tier,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextEnd,
      gracePeriodEndsAt: null,
    };
  }
}
