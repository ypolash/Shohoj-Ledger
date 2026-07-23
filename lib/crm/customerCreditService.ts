import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { RiskLevel } from "@prisma/client";

/**
 * Creates or initializes a credit profile for a customer.
 */
export async function createProfile(companyId: string, customerId: string, creditLimit: number = 0, creditDays: number = 0) {
  const existing = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (existing) {
    throw new Error("Credit profile already exists for this customer.");
  }

  const profile = await prisma.customerCreditProfile.create({
    data: {
      companyId,
      customerId,
      creditLimit,
      creditDays,
      currentExposure: 0,
      availableCredit: creditLimit,
      riskLevel: RiskLevel.LOW
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerCreditProfile",
    entityId: profile.id,
    action: "CREATE",
    description: `Created credit profile for customer ${customerId} with limit ${creditLimit}`
  });

  return profile;
}

/**
 * Updates the credit limit and days, recalibrating the risk level.
 */
export async function updateCreditLimit(companyId: string, customerId: string, userId: string, creditLimit: number, creditDays: number) {
  if (creditLimit < 0 || creditDays < 0) {
    throw new Error("Credit values cannot be negative");
  }

  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) throw new Error("Credit profile not found");

  const availableCredit = creditLimit - Number(profile.currentExposure);
  
  const updated = await prisma.customerCreditProfile.update({
    where: { id: profile.id },
    data: {
      creditLimit,
      creditDays,
      availableCredit
    }
  });

  // Re-evaluate risk implicitly
  await evaluateRisk(companyId, customerId);

  await logAudit({
    module: "CRM",
    entityType: "CustomerCreditProfile",
    entityId: profile.id,
    action: "UPDATE",
    description: `Updated credit limit to ${creditLimit} and days to ${creditDays}`
  });

  return await prisma.customerCreditProfile.findUnique({ where: { id: profile.id } });
}

/**
 * Calculates current exposure by summing approved sales orders (unshipped), pending deliveries (un-invoiced), and unpaid invoices.
 * For Phase 3H (pre-invoice), we mock the logic that will integrate with Phase 3I and Phase 3H (Invoicing).
 */
export async function calculateExposure(companyId: string, customerId: string) {
  // In a full system:
  // Exposure = (Approved Sales Orders - Delivered) + (Delivered - Invoiced) + Unpaid AR Balance
  // Since we don't have invoices yet, we only track Sales Orders + Delivery Orders value conceptually.
  // For V1.3 Phase 3H, we'll keep `currentExposure` strictly managed via the `recordExposure` explicit calls.

  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  return profile ? Number(profile.currentExposure) : 0;
}

/**
 * Recalculates available credit.
 */
export async function calculateAvailableCredit(companyId: string, customerId: string) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) return 0;
  return Number(profile.creditLimit) - Number(profile.currentExposure);
}

/**
 * Manually places a customer's account on a credit hold.
 */
export async function placeOnHold(companyId: string, customerId: string, userId: string, reason: string) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) throw new Error("Credit profile not found");

  const updated = await prisma.customerCreditProfile.update({
    where: { id: profile.id },
    data: {
      isOnHold: true,
      holdReason: reason
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerCreditProfile",
    entityId: profile.id,
    action: "UPDATE",
    description: `Placed customer on credit hold. Reason: ${reason}`
  });

  return updated;
}

/**
 * Releases a manual credit hold.
 */
export async function releaseHold(companyId: string, customerId: string, userId: string, reason: string) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) throw new Error("Credit profile not found");

  const updated = await prisma.customerCreditProfile.update({
    where: { id: profile.id },
    data: {
      isOnHold: false,
      holdReason: null
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerCreditProfile",
    entityId: profile.id,
    action: "UPDATE",
    description: `Released credit hold. Reason: ${reason}`
  });

  return updated;
}

/**
 * Validates if an upcoming transaction (e.g. Sales Order) exceeds credit limits.
 */
export async function validateCredit(companyId: string, customerId: string, transactionAmount: number) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) {
    // If no profile, assume strict cash-only or throw. We'll throw to enforce setup.
    throw new Error("Customer has no credit profile established.");
  }

  if (profile.isOnHold) {
    throw new Error(`Account is on CREDIT HOLD. Reason: ${profile.holdReason}`);
  }

  const newExposure = Number(profile.currentExposure) + transactionAmount;
  
  if (newExposure > Number(profile.creditLimit)) {
    throw new Error(`Credit Limit Exceeded. Available: ${profile.availableCredit}, Required: ${transactionAmount}`);
  }

  return { valid: true, newExposure };
}

/**
 * Records an increase or decrease in exposure and logs it in the history.
 */
export async function recordExposure(
  companyId: string, 
  customerId: string, 
  amountChange: number, 
  referenceType: string, 
  referenceId: string, 
  userId: string,
  remarks?: string
) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) throw new Error("Credit profile not found");

  const previousExposure = Number(profile.currentExposure);
  const newExposure = previousExposure + amountChange;
  const availableCredit = Number(profile.creditLimit) - newExposure;

  const updatedProfile = await prisma.customerCreditProfile.update({
    where: { id: profile.id },
    data: {
      currentExposure: newExposure,
      availableCredit: availableCredit
    }
  });

  await prisma.customerCreditHistory.create({
    data: {
      companyId,
      customerId,
      referenceType,
      referenceId,
      previousExposure,
      newExposure,
      remarks: remarks || `Exposure adjusted by ${amountChange}`,
      createdById: userId
    }
  });

  await evaluateRisk(companyId, customerId);

  return updatedProfile;
}

/**
 * Wrapper specifically for releasing exposure (payments or cancelled orders).
 */
export async function recordRelease(companyId: string, customerId: string, releaseAmount: number, referenceType: string, referenceId: string, userId: string, remarks?: string) {
  return await recordExposure(companyId, customerId, -Math.abs(releaseAmount), referenceType, referenceId, userId, remarks);
}

/**
 * Retrieves the history of credit limit / exposure changes.
 */
export async function getCreditHistory(companyId: string, customerId: string) {
  return await prisma.customerCreditHistory.findMany({
    where: { companyId, customerId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } }
  });
}

/**
 * Evaluates the customer's risk level based on utilization.
 */
export async function evaluateRisk(companyId: string, customerId: string) {
  const profile = await prisma.customerCreditProfile.findFirst({
    where: { companyId, customerId }
  });

  if (!profile) return;

  const limit = Number(profile.creditLimit);
  const exposure = Number(profile.currentExposure);

  let newRiskLevel = RiskLevel.LOW;

  if (limit > 0) {
    const utilization = exposure / limit;
    
    if (utilization >= 0.9) {
      newRiskLevel = RiskLevel.CRITICAL;
    } else if (utilization >= 0.75) {
      newRiskLevel = RiskLevel.HIGH;
    } else if (utilization >= 0.5) {
      newRiskLevel = RiskLevel.MEDIUM;
    }
  } else if (exposure > 0) {
    // Has exposure but 0 limit
    newRiskLevel = RiskLevel.CRITICAL;
  }

  if (profile.riskLevel !== newRiskLevel) {
    await prisma.customerCreditProfile.update({
      where: { id: profile.id },
      data: { riskLevel: newRiskLevel }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerCreditProfile",
      entityId: profile.id,
      action: "UPDATE",
      description: `Risk level changed from ${profile.riskLevel} to ${newRiskLevel} (Utilization)`
    });
  }

  return newRiskLevel;
}
