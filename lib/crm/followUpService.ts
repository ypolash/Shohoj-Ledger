import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { generateCustomerCode } from "@/lib/crm/customerService";

export interface FollowUpFilterParams {
  search?: string;
  status?: string; // 'UPCOMING' | 'TODAY' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'ALL'
  type?: string;   // 'CALL' | 'MEETING' | 'ONLINE_MEETING' | 'WHATSAPP' | 'VISIT' | 'DEMO' | 'TASK' | 'PAYMENT_FOLLOWUP'
  priority?: string;
  customerId?: string;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

export interface FollowUpCreateData {
  // Existing Customer OR New Customer fields
  customerId?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  address?: string;
  
  // Appointment / Follow-up details
  type: string; // 'CALL' | 'MEETING' | 'ONLINE_MEETING' | 'WHATSAPP' | 'VISIT' | 'DEMO' | 'TASK' | 'PAYMENT_FOLLOWUP'
  title: string;
  date: string | Date;
  status?: string; // default 'UPCOMING'
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  agenda?: string;
  location?: string;
  meetingLink?: string;
  leadId?: string;
}

export interface FollowUpUpdateData {
  title?: string;
  type?: string;
  date?: string | Date;
  status?: string; // 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  agenda?: string;
  outcome?: string;
  location?: string;
  meetingLink?: string;
}

/**
 * Parses structured notes or plain string
 */
export function parseNotesMetadata(rawNotes: string | null | undefined): {
  agenda: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  outcome?: string;
  location?: string;
  meetingLink?: string;
  raw: string;
} {
  if (!rawNotes) {
    return { agenda: "", priority: "MEDIUM", raw: "" };
  }

  try {
    const parsed = JSON.parse(rawNotes);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        agenda: parsed.agenda || parsed.notes || "",
        priority: parsed.priority || "MEDIUM",
        outcome: parsed.outcome,
        location: parsed.location,
        meetingLink: parsed.meetingLink,
        raw: rawNotes,
      };
    }
  } catch {
    // Plain text
  }

  return {
    agenda: rawNotes,
    priority: "MEDIUM",
    raw: rawNotes,
  };
}

/**
 * Encodes structured notes to string
 */
export function encodeNotesMetadata(data: {
  agenda?: string;
  notes?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  outcome?: string;
  location?: string;
  meetingLink?: string;
}): string {
  const payload = {
    agenda: data.agenda || data.notes || "",
    priority: data.priority || "MEDIUM",
    ...(data.outcome ? { outcome: data.outcome } : {}),
    ...(data.location ? { location: data.location } : {}),
    ...(data.meetingLink ? { meetingLink: data.meetingLink } : {}),
  };
  return JSON.stringify(payload);
}

/**
 * Lists follow-ups and appointments with computed overdue status and counts.
 */
export async function listFollowUps(companyId: string, params: FollowUpFilterParams = {}) {
  const {
    search,
    status,
    type,
    priority,
    customerId,
    from,
    to,
    skip = 0,
    take = 50,
  } = params;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Build where clause
  const where: any = {
    companyId,
  };

  if (customerId) {
    where.customerId = customerId;
  }

  if (type && type !== "ALL") {
    where.type = type;
  }

  // Handle custom date filters
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  // Handle search filter across title, customer name, phone, email
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      {
        customer: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { customerCode: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // Fetch all matching activities (or subset based on status)
  const activities = await prisma.customerActivity.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          email: true,
          phone: true,
          mobile: true,
          status: true,
          tags: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
            select: { addressLine1: true, city: true },
          },
          contacts: {
            where: { isPrimary: true },
            take: 1,
            select: { name: true, phone: true, email: true },
          },
        },
      },
      performedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // Calculate comprehensive stats across all company follow-ups
  const allCompanyActivities = await prisma.customerActivity.findMany({
    where: { companyId },
    select: { id: true, date: true, status: true, type: true, notes: true },
  });

  let countToday = 0;
  let countUpcoming = 0;
  let countOverdue = 0;
  let countCompleted = 0;
  let countCancelled = 0;
  const typeCounts: Record<string, number> = {};

  allCompanyActivities.forEach((act) => {
    const actDate = new Date(act.date);
    const isPast = actDate < now;
    const isToday = actDate >= startOfToday && actDate <= endOfToday;
    const isDone = act.status === "COMPLETED";
    const isCancel = act.status === "CANCELLED";

    if (isDone) {
      countCompleted++;
    } else if (isCancel) {
      countCancelled++;
    } else if (isPast && !isToday) {
      countOverdue++;
    } else if (isToday) {
      countToday++;
    } else {
      countUpcoming++;
    }

    typeCounts[act.type] = (typeCounts[act.type] || 0) + 1;
  });

  // Decorate items with parsed metadata and computed status
  const formattedActivities = activities.map((act) => {
    const meta = parseNotesMetadata(act.notes);
    const actDate = new Date(act.date);
    const isPast = actDate < now;
    const isToday = actDate >= startOfToday && actDate <= endOfToday;

    let computedStatus = act.status;
    if (act.status === "UPCOMING" || !act.status) {
      if (isPast && !isToday) {
        computedStatus = "OVERDUE";
      } else if (isToday) {
        computedStatus = "TODAY";
      } else {
        computedStatus = "UPCOMING";
      }
    }

    return {
      id: act.id,
      companyId: act.companyId,
      customerId: act.customerId,
      customer: act.customer,
      performedBy: act.performedBy,
      type: act.type,
      title: act.title || "Follow-up Appointment",
      date: act.date,
      status: act.status,
      computedStatus,
      priority: meta.priority,
      agenda: meta.agenda,
      outcome: meta.outcome,
      location: meta.location,
      meetingLink: meta.meetingLink,
      notes: act.notes,
      createdAt: act.createdAt,
      updatedAt: act.updatedAt,
    };
  });

  // Apply in-memory status filter if user selected dynamic tabs
  let filtered = formattedActivities;
  if (status && status !== "ALL") {
    if (status === "OVERDUE") {
      filtered = formattedActivities.filter((a) => a.computedStatus === "OVERDUE");
    } else if (status === "TODAY") {
      filtered = formattedActivities.filter((a) => a.computedStatus === "TODAY");
    } else if (status === "UPCOMING") {
      filtered = formattedActivities.filter(
        (a) => a.computedStatus === "UPCOMING" || a.computedStatus === "TODAY"
      );
    } else if (status === "COMPLETED") {
      filtered = formattedActivities.filter((a) => a.status === "COMPLETED");
    } else if (status === "CANCELLED") {
      filtered = formattedActivities.filter((a) => a.status === "CANCELLED");
    } else {
      filtered = formattedActivities.filter((a) => a.status === status);
    }
  }

  // Priority filter
  if (priority && priority !== "ALL") {
    filtered = filtered.filter((a) => a.priority === priority);
  }

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + take);

  return {
    data: paginated,
    total,
    counts: {
      total: allCompanyActivities.length,
      today: countToday,
      upcoming: countUpcoming,
      overdue: countOverdue,
      completed: countCompleted,
      cancelled: countCancelled,
      byType: typeCounts,
    },
  };
}

/**
 * Gets a single follow-up appointment by ID.
 */
export async function getFollowUpById(companyId: string, id: string) {
  const act = await prisma.customerActivity.findFirst({
    where: { id, companyId },
    include: {
      customer: {
        include: {
          contacts: true,
          addresses: true,
        },
      },
      performedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!act) return null;

  const meta = parseNotesMetadata(act.notes);
  return {
    ...act,
    priority: meta.priority,
    agenda: meta.agenda,
    outcome: meta.outcome,
    location: meta.location,
    meetingLink: meta.meetingLink,
  };
}

/**
 * Creates a follow-up / appointment.
 * IF the customer does not exist (new contact appointed later), it AUTOMATICALLY
 * saves/creates the customer in the database so they are preserved in the customer records.
 */
export async function createFollowUp(
  companyId: string,
  userId: string,
  data: FollowUpCreateData
) {
  let customerId = data.customerId;

  // If no customerId provided, look up or automatically create the Customer!
  if (!customerId) {
    if (!data.customerName && !data.phone) {
      throw new Error("Customer Name or Phone Number is required to schedule a follow-up.");
    }

    const cleanPhone = data.phone ? data.phone.trim() : null;
    const cleanEmail = data.email ? data.email.trim().toLowerCase() : null;

    // Check if customer exists by phone or email in this company
    let existingCustomer = null;
    if (cleanPhone || cleanEmail) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId,
          OR: [
            ...(cleanPhone ? [{ phone: cleanPhone }, { mobile: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Auto-save/create new Customer who appointed us later!
      const customerCode = await generateCustomerCode(companyId);
      const newCustomer = await prisma.customer.create({
        data: {
          companyId,
          customerCode,
          name: data.customerName || `Customer (${cleanPhone || "New"})`,
          displayName: data.companyName || undefined,
          phone: cleanPhone || undefined,
          mobile: cleanPhone || undefined,
          email: cleanEmail || undefined,
          notes: `Auto-saved from Appointment/Follow-up booking: ${data.title || "Appointed Later"}`,
          tags: ["Appointed-Later", "Follow-Up"],
          createdById: userId,
          contacts: {
            create: {
              name: data.customerName || "Primary Contact",
              phone: cleanPhone || undefined,
              email: cleanEmail || undefined,
              isPrimary: true,
              companyId,
            },
          },
          ...(data.address
            ? {
                addresses: {
                  create: {
                    type: "BILLING",
                    addressLine1: data.address,
                    isDefault: true,
                    companyId,
                  },
                },
              }
            : {}),
        },
      });

      customerId = newCustomer.id;

      await logAudit({
        module: "CRM",
        entityType: "Customer",
        entityId: newCustomer.id,
        action: "CREATE",
        description: `Auto-saved customer ${newCustomer.name} (${newCustomer.customerCode}) from appointment booking.`,
        afterValue: newCustomer,
      });
    }
  }

  // Encode notes with metadata
  const encodedNotes = encodeNotesMetadata({
    agenda: data.agenda || data.notes,
    priority: data.priority || "MEDIUM",
    location: data.location,
    meetingLink: data.meetingLink,
  });

  const parsedDate = data.date ? new Date(data.date) : new Date();

  // Create the CustomerActivity (Follow-up)
  const activity = await prisma.customerActivity.create({
    data: {
      companyId,
      customerId,
      performedById: userId,
      type: data.type || "CALL",
      title: data.title || "Follow-up Appointment",
      date: parsedDate,
      status: data.status || "UPCOMING",
      notes: encodedNotes,
    },
    include: {
      customer: true,
      performedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // If a lead was associated or matches phone, update lead's nextFollowUp
  if (data.leadId) {
    try {
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { nextFollowUp: parsedDate },
      });
    } catch {
      // Ignore if lead not found
    }
  } else if (data.phone) {
    try {
      await prisma.lead.updateMany({
        where: { companyId, phone: data.phone },
        data: { nextFollowUp: parsedDate },
      });
    } catch {
      // Ignore
    }
  }

  await logAudit({
    module: "CRM",
    entityType: "FollowUp",
    entityId: activity.id,
    action: "CREATE",
    description: `Scheduled follow-up '${activity.title}' with ${activity.customer.name} for ${parsedDate.toLocaleString()}`,
    afterValue: activity,
  });

  return activity;
}

/**
 * Updates a follow-up appointment (reschedule, complete, cancel, add outcome notes).
 */
export async function updateFollowUp(
  companyId: string,
  id: string,
  data: FollowUpUpdateData
) {
  const existing = await prisma.customerActivity.findFirst({
    where: { id, companyId },
    include: { customer: true },
  });

  if (!existing) {
    throw new Error("Follow-up appointment not found.");
  }

  const existingMeta = parseNotesMetadata(existing.notes);

  const updatedMeta = encodeNotesMetadata({
    agenda: data.agenda !== undefined ? data.agenda : existingMeta.agenda,
    notes: data.notes !== undefined ? data.notes : existingMeta.agenda,
    priority: data.priority || existingMeta.priority,
    outcome: data.outcome !== undefined ? data.outcome : existingMeta.outcome,
    location: data.location !== undefined ? data.location : existingMeta.location,
    meetingLink: data.meetingLink !== undefined ? data.meetingLink : existingMeta.meetingLink,
  });

  const updatePayload: any = {
    notes: updatedMeta,
  };

  if (data.title) updatePayload.title = data.title;
  if (data.type) updatePayload.type = data.type;
  if (data.date) updatePayload.date = new Date(data.date);
  if (data.status) updatePayload.status = data.status;

  const updated = await prisma.customerActivity.update({
    where: { id },
    data: updatePayload,
    include: {
      customer: true,
      performedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await logAudit({
    module: "CRM",
    entityType: "FollowUp",
    entityId: updated.id,
    action: "UPDATE",
    description: `Updated follow-up '${updated.title}' (${updated.status}) for ${updated.customer.name}`,
    beforeValue: existing,
    afterValue: updated,
  });

  return updated;
}

/**
 * Deletes a follow-up appointment.
 */
export async function deleteFollowUp(companyId: string, id: string) {
  const existing = await prisma.customerActivity.findFirst({
    where: { id, companyId },
  });

  if (!existing) {
    throw new Error("Follow-up appointment not found.");
  }

  await prisma.customerActivity.delete({
    where: { id },
  });

  await logAudit({
    module: "CRM",
    entityType: "FollowUp",
    entityId: id,
    action: "DELETE",
    description: `Deleted follow-up appointment ${existing.title}`,
    beforeValue: existing,
  });

  return { success: true };
}

/**
 * Gets overview stats for CRM Follow-ups
 */
export async function getFollowUpStats(companyId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const activities = await prisma.customerActivity.findMany({
    where: { companyId },
    select: { id: true, date: true, status: true, type: true },
  });

  let today = 0;
  let upcoming = 0;
  let overdue = 0;
  let completed = 0;
  let cancelled = 0;
  const byType: Record<string, number> = {};

  activities.forEach((act) => {
    const d = new Date(act.date);
    const isPast = d < now;
    const isToday = d >= startOfToday && d <= endOfToday;

    if (act.status === "COMPLETED") {
      completed++;
    } else if (act.status === "CANCELLED") {
      cancelled++;
    } else if (isPast && !isToday) {
      overdue++;
    } else if (isToday) {
      today++;
    } else {
      upcoming++;
    }

    byType[act.type] = (byType[act.type] || 0) + 1;
  });

  return {
    total: activities.length,
    today,
    upcoming,
    overdue,
    completed,
    cancelled,
    byType,
  };
}
