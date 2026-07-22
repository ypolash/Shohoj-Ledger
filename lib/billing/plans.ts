export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
  maxUsers: number;
  maxProjects: number;
  maxStorageMB: number;
  maxClients: number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceMonthlyBDT: number;
  priceYearlyBDT: number;
  limits: PlanLimits;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    id: "FREE",
    name: "Free Tier",
    priceMonthlyBDT: 0,
    priceYearlyBDT: 0,
    limits: {
      maxUsers: 5,
      maxProjects: 3,
      maxStorageMB: 500,
      maxClients: 10,
    },
    features: ["Core Accounting", "Basic HR", "Community Support"]
  },
  PRO: {
    id: "PRO",
    name: "Professional",
    priceMonthlyBDT: 1500,
    priceYearlyBDT: 15000,
    limits: {
      maxUsers: 50,
      maxProjects: 100,
      maxStorageMB: 5000,
      maxClients: 500,
    },
    features: ["Advanced Payroll", "Full CRM", "Priority Support"]
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthlyBDT: 5000,
    priceYearlyBDT: 50000,
    limits: {
      maxUsers: 999999, // Unlimited
      maxProjects: 999999,
      maxStorageMB: 500000,
      maxClients: 999999,
    },
    features: ["All Modules", "Custom Branding", "Dedicated Account Manager"]
  }
};

/**
 * Helper to fetch plan limits securely on the backend.
 */
export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return SUBSCRIPTION_PLANS[tier]?.limits || SUBSCRIPTION_PLANS["FREE"].limits;
}
