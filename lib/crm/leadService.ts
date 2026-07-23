import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { LeadStatus, LeadPriority, LeadRating } from "@prisma/client";

/**
 * Validates a lead for constraints such as leadNumber and email uniqueness per company.
 */
export async function validateLead(
  companyId: string,
  data: { leadNumber?: string; email?: string; id?: string }
) {
  const orConditions: any[] = [];
  
  if (data.leadNumber) orConditions.push({ leadNumber: data.leadNumber });
  if (data.email) orConditions.push({ email: data.email });

  if (orConditions.length === 0) return { valid: true };

  const existing = await prisma.lead.findFirst({
    where: {
      companyId,
      OR: orConditions,
      ...(data.id ? { id: { not: data.id } } : {}),
    },
    select: { leadNumber: true, email: true }
  });

  if (existing) {
    if (existing.leadNumber === data.leadNumber) throw new Error("Lead Number already exists");
    if (existing.email && existing.email === data.email) throw new Error("Email already exists");
  }

  return { valid: true };
}

/**
 * Generates a unique lead number.
 */
export async function generateLeadNumber(companyId: string): Promise<string> {
  const count = await prisma.lead.count({
    where: { companyId }
  });
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");
  
  return `LEAD-${dateStr}-${nextNumber}`;
}

/**
 * Creates a new lead.
 */
export async function createLead(companyId: string, userId: string, data: any) {
  if (!data.leadNumber) {
    data.leadNumber = await generateLeadNumber(companyId);
  }

  await validateLead(companyId, data);

  const lead = await prisma.lead.create({
    data: {
      ...data,
      companyId,
      createdById: userId,
    }
  });

  await addActivity(companyId, userId, lead.id, "CREATED", "Lead created", "New lead entry created in system.");

  await logAudit({
    module: "CRM",
    entityType: "Lead",
    entityId: lead.id,
    action: "CREATE",
    description: `Created lead ${lead.leadNumber}`,
    afterValue: lead,
  });

  return lead;
}

/**
 * Updates an existing lead.
 */
export async function updateLead(companyId: string, id: string, userId: string, data: any) {
  await validateLead(companyId, { ...data, id });

  const existing = await prisma.lead.findUnique({
    where: { id }
  });
  
  if (!existing || existing.companyId !== companyId) throw new Error("Lead not found");

  const lead = await prisma.lead.update({
    where: { id },
    data,
  });

  await addActivity(companyId, userId, lead.id, "UPDATED", "Lead updated", "Lead details were updated.");

  await logAudit({
    module: "CRM",
    entityType: "Lead",
    entityId: lead.id,
    action: "UPDATE",
    description: `Updated lead ${lead.leadNumber}`,
    beforeValue: existing,
    afterValue: lead,
  });

  return lead;
}

/**
 * Deletes a lead.
 */
export async function deleteLead(companyId: string, id: string) {
  const existing = await prisma.lead.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Lead not found");

  await prisma.lead.delete({
    where: { id }
  });

  await logAudit({
    module: "CRM",
    entityType: "Lead",
    entityId: id,
    action: "DELETE",
    description: `Deleted lead ${existing.leadNumber}`,
    beforeValue: existing,
  });

  return true;
}

/**
 * Retrieves a lead by ID with relations.
 */
export async function getLead(companyId: string, id: string) {
  return await prisma.lead.findFirst({
    where: { id, companyId },
    include: {
      assignedTo: true,
      leadSourceModel: true,
      activities: {
        orderBy: { activityDate: 'desc' }
      }
    }
  });
}

/**
 * Searches leads with pagination and filtering.
 */
export async function searchLeads(
  companyId: string,
  params: { query?: string; status?: LeadStatus; priority?: LeadPriority; assignedToId?: string; skip?: number; take?: number }
) {
  const where: any = { companyId };
  
  if (params.query) {
    where.OR = [
      { companyName: { contains: params.query, mode: 'insensitive' } },
      { leadNumber: { contains: params.query, mode: 'insensitive' } },
      { email: { contains: params.query, mode: 'insensitive' } },
      { phone: { contains: params.query, mode: 'insensitive' } },
    ];
  }

  if (params.status) where.leadStatus = params.status;
  if (params.priority) where.leadPriority = params.priority;
  if (params.assignedToId) where.assignedToId = params.assignedToId;

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: params.skip || 0,
      take: params.take || 50,
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: true, leadSourceModel: true }
    }),
    prisma.lead.count({ where })
  ]);

  return { data, total };
}

/**
 * Assigns a lead to an employee.
 */
export async function assignLead(companyId: string, id: string, userId: string, assignedToId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: assignedToId, companyId }
  });

  if (!employee) throw new Error("Employee not found");

  const lead = await updateLead(companyId, id, userId, { assignedToId });
  
  await addActivity(companyId, userId, id, "ASSIGNED", "Lead Assigned", `Lead was assigned to employee ID ${assignedToId}.`);
  
  return lead;
}

/**
 * Qualifies a lead.
 */
export async function qualifyLead(companyId: string, id: string, userId: string) {
  const lead = await updateLead(companyId, id, userId, { leadStatus: LeadStatus.QUALIFIED });
  
  await addActivity(companyId, userId, id, "STATUS_CHANGE", "Lead Qualified", "Lead status updated to QUALIFIED.");
  
  return lead;
}

/**
 * Converts a lead to a Customer. 
 * (Future Opportunity pipeline will integrate here as well).
 */
export async function convertLead(companyId: string, id: string, userId: string, customerData: any) {
  const lead = await prisma.lead.findFirst({ where: { id, companyId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.leadStatus === LeadStatus.CONVERTED) throw new Error("Lead is already converted");

  // In a real scenario, we would use a transaction to create the customer and update the lead.
  // We simulate calling customerService implicitly or expecting customerData to have what is needed.
  
  let newCustomerId = customerData?.id;
  
  if (!newCustomerId) {
     // Usually we would import createCustomer, but we are keeping this decoupled.
     // Assuming customer creation logic is handled or we just link an existing customer for now.
     // If we were to create one here, we'd need more customer fields.
     throw new Error("Customer ID required for conversion."); 
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      leadStatus: LeadStatus.CONVERTED,
      customerId: newCustomerId
    }
  });

  await addActivity(companyId, userId, id, "CONVERTED", "Lead Converted", `Lead converted to Customer ID ${newCustomerId}. Opportunity pipeline pending Phase 3C.`);
  
  await logAudit({
    module: "CRM",
    entityType: "Lead",
    entityId: id,
    action: "UPDATE",
    description: `Converted lead ${updatedLead.leadNumber} to customer`,
    afterValue: updatedLead,
  });

  return updatedLead;
}

/**
 * Marks a lead as lost.
 */
export async function closeLostLead(companyId: string, id: string, userId: string, lostReason: string) {
  const lead = await updateLead(companyId, id, userId, { 
    leadStatus: LeadStatus.LOST,
    lostReason
  });
  
  await addActivity(companyId, userId, id, "STATUS_CHANGE", "Lead Lost", `Lead closed as lost. Reason: ${lostReason}`);
  
  return lead;
}

/**
 * Adds an activity to a lead.
 */
export async function addActivity(
  companyId: string, 
  userId: string, 
  leadId: string, 
  activityType: string, 
  subject: string, 
  description?: string
) {
  return await prisma.leadActivity.create({
    data: {
      companyId,
      leadId,
      activityType,
      subject,
      description,
      createdById: userId,
      type: activityType, // legacy support
      performedById: userId // legacy support
    }
  });
}

/**
 * Retrieves audit history for a specific lead.
 */
export async function getLeadHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "Lead",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
