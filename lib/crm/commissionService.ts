import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { CalculationType, CommissionStatus } from "@prisma/client";

/**
 * Creates a new commission policy.
 */
export async function createPolicy(companyId: string, data: any) {
  const policy = await prisma.commissionPolicy.create({
    data: {
      companyId,
      name: data.name,
      description: data.description,
      calculationType: data.calculationType,
      commissionRate: data.commissionRate || 0,
      minimumTarget: data.minimumTarget,
      maximumCommission: data.maximumCommission,
      isActive: data.isActive ?? true,
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CommissionPolicy",
    entityId: policy.id,
    action: "CREATE",
    description: `Created Commission Policy: ${policy.name}`
  });

  return policy;
}

/**
 * Updates an existing commission policy.
 */
export async function updatePolicy(companyId: string, id: string, data: any) {
  const existing = await prisma.commissionPolicy.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Policy not found");

  const policy = await prisma.commissionPolicy.update({
    where: { id },
    data
  });

  await logAudit({
    module: "CRM",
    entityType: "CommissionPolicy",
    entityId: policy.id,
    action: "UPDATE",
    description: `Updated Commission Policy: ${policy.name}`
  });

  return policy;
}

/**
 * Validates the underlying math to ensure it doesn't exceed maximums.
 */
export async function validateCommission(policy: any, baseAmount: number) {
  if (policy.minimumTarget && baseAmount < Number(policy.minimumTarget)) {
    return { valid: false, amount: 0, reason: "Minimum target not met" };
  }

  let calculated = 0;
  if (policy.calculationType === CalculationType.PERCENTAGE) {
    calculated = (baseAmount * Number(policy.commissionRate)) / 100;
  } else if (policy.calculationType === CalculationType.FIXED_AMOUNT) {
    calculated = Number(policy.commissionRate);
  } else {
    throw new Error(`Calculation type ${policy.calculationType} not implemented in V1.3 engine`);
  }

  if (policy.maximumCommission && calculated > Number(policy.maximumCommission)) {
    calculated = Number(policy.maximumCommission);
  }

  return { valid: true, amount: calculated };
}

/**
 * Calculates a pending commission for a sales event (Order or Payment).
 */
export async function calculateCommission(companyId: string, salespersonId: string, policyId: string, customerId: string, baseAmount: number, reference: { salesOrderId?: string; paymentId?: string }) {
  const policy = await prisma.commissionPolicy.findFirst({ where: { id: policyId, companyId } });
  if (!policy || !policy.isActive) throw new Error("Active policy not found");

  const validation = await validateCommission(policy, baseAmount);
  if (!validation.valid) {
    throw new Error(validation.reason || "Failed to calculate commission");
  }

  const commission = await prisma.salesCommission.create({
    data: {
      companyId,
      salespersonId,
      customerId,
      commissionPolicyId: policyId,
      salesOrderId: reference.salesOrderId,
      paymentId: reference.paymentId,
      baseAmount,
      commissionAmount: validation.amount,
      status: CommissionStatus.CALCULATED,
      calculatedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesCommission",
    entityId: commission.id,
    action: "CREATE",
    description: `Calculated commission of ${validation.amount} for salesperson ${salespersonId}`
  });

  return commission;
}

/**
 * Recalculates an existing unapproved commission if the underlying policy or base amount changes.
 */
export async function recalculateCommission(companyId: string, id: string, newBaseAmount?: number) {
  const existing = await prisma.salesCommission.findFirst({
    where: { id, companyId },
    include: { policy: true }
  });

  if (!existing) throw new Error("Commission not found");
  if (existing.status === CommissionStatus.APPROVED || existing.status === CommissionStatus.PAID) {
    throw new Error("Cannot recalculate an approved or paid commission");
  }

  const base = newBaseAmount !== undefined ? newBaseAmount : Number(existing.baseAmount);
  const validation = await validateCommission(existing.policy, base);

  if (!validation.valid) {
    throw new Error(validation.reason || "Failed to recalculate commission");
  }

  const updated = await prisma.salesCommission.update({
    where: { id },
    data: {
      baseAmount: base,
      commissionAmount: validation.amount,
      calculatedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesCommission",
    entityId: id,
    action: "UPDATE",
    description: `Recalculated commission to ${validation.amount}`
  });

  return updated;
}

/**
 * Approves a calculated commission, making it ready for payroll.
 */
export async function approveCommission(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesCommission.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== CommissionStatus.CALCULATED) {
    throw new Error("Only CALCULATED commissions can be approved");
  }

  const updated = await prisma.salesCommission.update({
    where: { id },
    data: {
      status: CommissionStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesCommission",
    entityId: id,
    action: "UPDATE",
    description: `Approved commission. Ready for payroll.`
  });

  return updated;
}

/**
 * Marks a commission as PAID. Normally invoked by a future Payroll integration.
 */
export async function markPaid(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesCommission.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== CommissionStatus.APPROVED) {
    throw new Error("Only APPROVED commissions can be marked as paid");
  }

  const updated = await prisma.salesCommission.update({
    where: { id },
    data: { status: CommissionStatus.PAID }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesCommission",
    entityId: id,
    action: "UPDATE",
    description: `Marked commission as PAID via manual override or payroll hook.`
  });

  return updated;
}

/**
 * Cancels a pending or approved commission.
 */
export async function cancelCommission(companyId: string, id: string, userId: string) {
  const existing = await prisma.salesCommission.findFirst({ where: { id, companyId } });
  if (!existing || existing.status === CommissionStatus.PAID || existing.status === CommissionStatus.CANCELLED) {
    throw new Error("Cannot cancel a paid or already cancelled commission");
  }

  const updated = await prisma.salesCommission.update({
    where: { id },
    data: { status: CommissionStatus.CANCELLED }
  });

  await logAudit({
    module: "CRM",
    entityType: "SalesCommission",
    entityId: id,
    action: "UPDATE",
    description: `Cancelled commission.`
  });

  return updated;
}

/**
 * Generates a summary report of commissions for a salesperson or period.
 */
export async function generateCommissionReport(companyId: string, filters: any = {}) {
  // Mock logic for V1.3: Fetches raw commissions. Later can aggregate using Prisma groupBy.
  return await prisma.salesCommission.findMany({
    where: {
      companyId,
      ...(filters.salespersonId && { salespersonId: filters.salespersonId }),
      ...(filters.status && { status: filters.status })
    },
    include: { policy: true }
  });
}

/**
 * Retrieves audit history for a specific commission.
 */
export async function getCommissionHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "SalesCommission",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
