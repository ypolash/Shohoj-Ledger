import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { CustomerPaymentStatus, PaymentMethod } from "@prisma/client";
import { recordRelease } from "./customerCreditService"; // Integration with Phase 3H

/**
 * Generates a unique Payment number.
 */
export async function generatePaymentNumber(companyId: string): Promise<string> {
  const count = await prisma.customerPayment.count({ where: { companyId } });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `PAY-${dateStr}-${nextNumber}`;
}

/**
 * Validates a Customer Payment payload.
 */
export async function validatePayment(companyId: string, data: any) {
  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
  if (!customer) throw new Error("Customer not found");

  if (Number(data.amount) <= 0) {
    throw new Error("Payment amount must be strictly positive");
  }

  if (!Object.values(PaymentMethod).includes(data.paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  return { valid: true };
}

/**
 * Creates a Customer Payment in DRAFT status.
 */
export async function createPayment(companyId: string, userId: string, data: any) {
  await validatePayment(companyId, data);

  const paymentNumber = await generatePaymentNumber(companyId);

  const payment = await prisma.customerPayment.create({
    data: {
      companyId,
      paymentNumber,
      customerId: data.customerId,
      paymentDate: data.paymentDate || new Date(),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      bankAccountId: data.bankAccountId,
      currency: data.currency || "USD",
      amount: data.amount,
      allocatedAmount: 0,
      unallocatedAmount: data.amount,
      status: CustomerPaymentStatus.DRAFT,
      remarks: data.remarks,
      createdById: userId,
    }
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerPayment",
    entityId: payment.id,
    action: "CREATE",
    description: `Created Customer Payment ${paymentNumber} for amount ${data.amount}`
  });

  return payment;
}

/**
 * Updates a DRAFT Payment.
 */
export async function updatePayment(companyId: string, id: string, userId: string, data: any) {
  const existing = await prisma.customerPayment.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== CustomerPaymentStatus.DRAFT) {
    throw new Error("Only DRAFT payments can be updated");
  }

  if (data.amount) {
    if (Number(data.amount) <= 0) throw new Error("Payment amount must be strictly positive");
    data.unallocatedAmount = data.amount; // Reset since no allocations allowed in DRAFT anyway
  }

  const payment = await prisma.customerPayment.update({
    where: { id },
    data
  });

  await logAudit({
    module: "CRM",
    entityType: "CustomerPayment",
    entityId: payment.id,
    action: "UPDATE",
    description: `Updated Customer Payment ${payment.paymentNumber}`
  });

  return payment;
}

/**
 * Posts the Payment (Locks it and prepares it for allocation).
 * Integrates with Accounting (future) and Credit Management.
 */
export async function postPayment(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerPayment.findFirst({ where: { id, companyId } });
  if (!existing || existing.status !== CustomerPaymentStatus.DRAFT) {
    throw new Error("Only DRAFT payments can be posted");
  }

  const payment = await prisma.customerPayment.update({
    where: { id },
    data: { status: CustomerPaymentStatus.POSTED }
  });

  // Release exposure in Phase 3H Credit Management (treating this payment as freeing up limit)
  try {
    await recordRelease(companyId, existing.customerId, Number(existing.amount), "PAYMENT", existing.id, userId, `Posted Payment ${existing.paymentNumber}`);
  } catch (err: any) {
    // If credit profile doesn't exist, we might ignore or log it, but for strictness we let it bubble or handle it gracefully.
    console.warn("Credit Release Failed:", err.message);
  }

  // NOTE: In Phase 3I/3H accounting, this would also call PostingService to create a Bank Receipt journal.

  await logAudit({
    module: "CRM",
    entityType: "CustomerPayment",
    entityId: payment.id,
    action: "UPDATE",
    description: `Posted Customer Payment ${payment.paymentNumber}`
  });

  return payment;
}

/**
 * Allocates a posted payment to a specific reference (e.g., Sales Order or Invoice).
 */
export async function allocatePayment(companyId: string, id: string, userId: string, referenceType: string, referenceId: string, amountToAllocate: number) {
  if (amountToAllocate <= 0) throw new Error("Allocation amount must be strictly positive");

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.customerPayment.findFirst({ where: { id, companyId } });
    if (!payment || (payment.status !== CustomerPaymentStatus.POSTED && payment.status !== CustomerPaymentStatus.PARTIALLY_ALLOCATED)) {
      throw new Error("Payment must be POSTED or PARTIALLY_ALLOCATED to allocate");
    }

    if (Number(payment.unallocatedAmount) < amountToAllocate) {
      throw new Error(`Cannot allocate ${amountToAllocate}. Only ${payment.unallocatedAmount} available.`);
    }

    const newAllocated = Number(payment.allocatedAmount) + amountToAllocate;
    const newUnallocated = Number(payment.unallocatedAmount) - amountToAllocate;
    
    let newStatus = CustomerPaymentStatus.PARTIALLY_ALLOCATED;
    if (newUnallocated === 0) {
      newStatus = CustomerPaymentStatus.FULLY_ALLOCATED;
    }

    await tx.customerPaymentAllocation.create({
      data: {
        customerPaymentId: id,
        referenceType,
        referenceId,
        allocatedAmount: amountToAllocate
      }
    });

    const updatedPayment = await tx.customerPayment.update({
      where: { id },
      data: {
        allocatedAmount: newAllocated,
        unallocatedAmount: newUnallocated,
        status: newStatus
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerPayment",
      entityId: payment.id,
      action: "UPDATE",
      description: `Allocated ${amountToAllocate} to ${referenceType} ${referenceId}`
    });

    return updatedPayment;
  });
}

/**
 * Removes an existing allocation and restores unallocated amount.
 */
export async function removeAllocation(companyId: string, id: string, allocationId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const allocation = await tx.customerPaymentAllocation.findFirst({
      where: { id: allocationId, customerPaymentId: id },
      include: { customerPayment: true }
    });

    if (!allocation || allocation.customerPayment.companyId !== companyId) {
      throw new Error("Allocation not found");
    }

    const payment = allocation.customerPayment;
    
    const newAllocated = Number(payment.allocatedAmount) - Number(allocation.allocatedAmount);
    const newUnallocated = Number(payment.unallocatedAmount) + Number(allocation.allocatedAmount);
    
    let newStatus = CustomerPaymentStatus.PARTIALLY_ALLOCATED;
    if (newAllocated === 0) {
      newStatus = CustomerPaymentStatus.POSTED;
    }

    await tx.customerPaymentAllocation.delete({ where: { id: allocationId } });

    const updatedPayment = await tx.customerPayment.update({
      where: { id },
      data: {
        allocatedAmount: newAllocated,
        unallocatedAmount: newUnallocated,
        status: newStatus
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerPayment",
      entityId: payment.id,
      action: "UPDATE",
      description: `Removed allocation of ${allocation.allocatedAmount} from ${allocation.referenceType}`
    });

    return updatedPayment;
  });
}

/**
 * Cancels a payment if it has not been fully utilized.
 */
export async function cancelPayment(companyId: string, id: string, userId: string) {
  const existing = await prisma.customerPayment.findFirst({
    where: { id, companyId },
    include: { allocations: true }
  });

  if (!existing || existing.status === CustomerPaymentStatus.CANCELLED) {
    throw new Error("Payment not found or already cancelled");
  }

  if (existing.allocations.length > 0) {
    throw new Error("Cannot cancel a payment that has active allocations. Remove allocations first.");
  }

  const payment = await prisma.customerPayment.update({
    where: { id },
    data: { status: CustomerPaymentStatus.CANCELLED }
  });

  // Re-add exposure if it was posted
  if (existing.status !== CustomerPaymentStatus.DRAFT) {
    try {
      await recordRelease(companyId, existing.customerId, -Number(existing.amount), "PAYMENT_CANCEL", existing.id, userId, `Cancelled Payment ${existing.paymentNumber}`);
    } catch (err: any) {
      console.warn("Credit Reversal Failed:", err.message);
    }
    // Phase 3I/3H accounting would also trigger a Reversal Journal here via PostingService.
  }

  await logAudit({
    module: "CRM",
    entityType: "CustomerPayment",
    entityId: payment.id,
    action: "UPDATE",
    description: `Cancelled Customer Payment ${payment.paymentNumber}`
  });

  return payment;
}

/**
 * Calculates outstanding (unallocated) balance for a specific payment.
 */
export async function calculateOutstanding(paymentId: string) {
  const payment = await prisma.customerPayment.findUnique({ where: { id: paymentId } });
  return payment ? Number(payment.unallocatedAmount) : 0;
}

/**
 * Calculates the total outstanding balance (unallocated payments) for a customer.
 */
export async function calculateCustomerBalance(companyId: string, customerId: string) {
  const payments = await prisma.customerPayment.findMany({
    where: { 
      companyId, 
      customerId,
      status: { in: [CustomerPaymentStatus.POSTED, CustomerPaymentStatus.PARTIALLY_ALLOCATED] } 
    }
  });

  return payments.reduce((sum, p) => sum + Number(p.unallocatedAmount), 0);
}

/**
 * Retrieves payment history.
 */
export async function getPaymentHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "CustomerPayment",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
