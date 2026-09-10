import { prisma } from "@/lib/prisma";

export interface SyncLeadTaskOptions {
  leadId: string;
  companyId?: string;
  tx?: any;
}

/**
 * Synchronizes a CRM Lead with the central Task table.
 * If the lead is assigned to an employee, creates or updates a Task row
 * for that employee so it immediately appears in the Android Staff App and Web ERP tasks.
 */
export async function syncLeadTask({
  leadId,
  companyId,
  tx
}: SyncLeadTaskOptions) {
  const db = tx || prisma;

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });

  if (!lead) return null;

  const effectiveCompanyId = companyId || lead.companyId;
  const leadMarker = `[CRM-LEAD:${lead.id}]`;

  // Search for any existing task created for this lead
  const existingTask = await db.task.findFirst({
    where: {
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      description: { contains: leadMarker }
    }
  });

  // If lead has no assigned employee, remove or unassign existing task
  if (!lead.assignedTo || !lead.assignedTo.employeeId) {
    if (existingTask) {
      await db.task.delete({
        where: { id: existingTask.id }
      });
    }
    return null;
  }

  const assignedEmployeeCode = lead.assignedTo.employeeId;
  const taskTitle = `Lead: ${lead.companyName} (${lead.contactPerson})`;
  const taskDescription = [
    `Assigned CRM Lead: ${lead.companyName}`,
    `Contact Person: ${lead.contactPerson}`,
    `Phone: ${lead.phone}${lead.email ? ` | Email: ${lead.email}` : ""}`,
    `Service: ${lead.serviceType || "General"}`,
    `Expected Value: ${lead.expectedValue ? `${lead.expectedValue} BDT` : "N/A"}`,
    `Lead Status: ${lead.status}`,
    `Notes: ${lead.notes || "None"}`,
    leadMarker
  ].join("\n");

  const dueDate = lead.expectedClosingDate || lead.nextFollowUp || null;
  const priority = lead.priority || "Medium";

  if (existingTask) {
    // Update existing task with latest lead details and reassigned employee if changed
    const updated = await db.task.update({
      where: { id: existingTask.id },
      data: {
        assignedToEmployeeId: assignedEmployeeCode,
        title: taskTitle,
        description: taskDescription,
        priority,
        dueDate,
        systemSource: "ERP",
        checklist: {
          type: "CRM_LEAD",
          leadId: lead.id,
          leadSerialNumber: lead.serialNumber
        }
      }
    });
    return updated;
  } else {
    // Create new Task
    const created = await db.task.create({
      data: {
        companyId: effectiveCompanyId,
        systemSource: "ERP",
        assignedToEmployeeId: assignedEmployeeCode,
        title: taskTitle,
        description: taskDescription,
        priority,
        status: "Pending",
        dueDate,
        checklist: {
          type: "CRM_LEAD",
          leadId: lead.id,
          leadSerialNumber: lead.serialNumber
        }
      }
    });
    return created;
  }
}

/**
 * Removes any Task associated with a deleted Lead.
 */
export async function deleteLeadTask(leadId: string, companyId?: string, tx?: any) {
  const db = tx || prisma;
  const leadMarker = `[CRM-LEAD:${leadId}]`;

  const existingTask = await db.task.findFirst({
    where: {
      ...(companyId ? { companyId } : {}),
      description: { contains: leadMarker }
    }
  });

  if (existingTask) {
    await db.task.delete({
      where: { id: existingTask.id }
    });
    return true;
  }
  return false;
}

/**
 * Backfills tasks for all existing assigned leads belonging to the specified company.
 */
export async function syncAllExistingAssignedLeads(companyId: string) {
  const assignedLeads = await prisma.lead.findMany({
    where: {
      companyId,
      assignedToId: { not: null }
    },
    select: { id: true }
  });

  let count = 0;
  for (const l of assignedLeads) {
    try {
      const task = await syncLeadTask({ leadId: l.id, companyId });
      if (task) count++;
    } catch (err) {
      console.error(`Error syncing lead ${l.id} to task:`, err);
    }
  }

  return { total: assignedLeads.length, synced: count };
}
