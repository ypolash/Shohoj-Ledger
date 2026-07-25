import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";
import { OpportunityStatus } from "@prisma/client";

/**
 * Validates an opportunity.
 */
export async function validateOpportunity(
  companyId: string,
  data: { customerId?: string; leadId?: string; stageId?: string; pipelineId?: string }
) {
  if (data.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId } });
    if (!customer) throw new Error("Customer not found or does not belong to company");
  }

  if (data.leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: data.leadId, companyId } });
    if (!lead) throw new Error("Lead not found or does not belong to company");
  }

  if (data.stageId) {
    const stage = await prisma.opportunityStage.findFirst({ where: { id: data.stageId, companyId } });
    if (!stage) throw new Error("Opportunity Stage not found");
  }
  
  if (data.pipelineId) {
    const pipeline = await prisma.opportunityPipeline.findFirst({ where: { id: data.pipelineId, companyId } });
    if (!pipeline) throw new Error("Pipeline not found");
  }

  return { valid: true };
}

/**
 * Generates a unique opportunity number.
 */
export async function generateOpportunityNumber(companyId: string): Promise<string> {
  const count = await prisma.opportunity.count({
    where: { companyId }
  });

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (count + 1).toString().padStart(4, "0");

  return `OPP-${dateStr}-${nextNumber}`;
}

/**
 * Creates a new opportunity.
 */
export async function createOpportunity(companyId: string, userId: string, data: any) {
  if (!data.opportunityNumber) {
    data.opportunityNumber = await generateOpportunityNumber(companyId);
  }

  await validateOpportunity(companyId, data);

  const opportunity = await prisma.opportunity.create({
    data: {
      ...data,
      tags: data.tags || [],
      companyId,
      createdById: userId,
    }
  });

  await addActivity(companyId, userId, opportunity.id, "CREATED", "Opportunity created", "New opportunity entered into pipeline.");

  await logAudit({
    module: "CRM",
    entityType: "Opportunity",
    entityId: opportunity.id,
    action: "CREATE",
    description: `Created opportunity ${opportunity.opportunityNumber}`,
    afterValue: opportunity,
  });

  return opportunity;
}

/**
 * Updates an existing opportunity.
 */
export async function updateOpportunity(companyId: string, id: string, userId: string, data: any) {
  await validateOpportunity(companyId, data);

  const existing = await prisma.opportunity.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Opportunity not found");

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data,
  });

  await addActivity(companyId, userId, id, "UPDATED", "Opportunity updated", "Opportunity details were updated.");

  await logAudit({
    module: "CRM",
    entityType: "Opportunity",
    entityId: opportunity.id,
    action: "UPDATE",
    description: `Updated opportunity ${opportunity.opportunityNumber}`,
    beforeValue: existing,
    afterValue: opportunity,
  });

  return opportunity;
}

/**
 * Deletes an opportunity.
 */
export async function deleteOpportunity(companyId: string, id: string) {
  const existing = await prisma.opportunity.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Opportunity not found");

  await prisma.opportunity.delete({
    where: { id }
  });

  await logAudit({
    module: "CRM",
    entityType: "Opportunity",
    entityId: id,
    action: "DELETE",
    description: `Deleted opportunity ${existing.opportunityNumber}`,
    beforeValue: existing,
  });

  return true;
}

/**
 * Retrieves an opportunity by ID.
 */
export async function getOpportunity(companyId: string, id: string) {
  return await prisma.opportunity.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      lead: true,
      stage: true,
      owner: true,
      pipeline: true,
      activities: {
        orderBy: { activityDate: 'desc' }
      }
    }
  });
}

/**
 * Searches opportunities with filtering.
 */
export async function searchOpportunities(
  companyId: string,
  params: { query?: string; status?: OpportunityStatus; stageId?: string; pipelineId?: string; ownerId?: string; skip?: number; take?: number }
) {
  const where: any = { companyId };

  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { opportunityNumber: { contains: params.query, mode: 'insensitive' } },
    ];
  }

  if (params.status) where.status = params.status;
  if (params.stageId) where.stageId = params.stageId;
  if (params.pipelineId) where.pipelineId = params.pipelineId;
  if (params.ownerId) where.ownerId = params.ownerId;

  const [data, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      skip: params.skip || 0,
      take: params.take || 50,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, stage: true, owner: true, pipeline: true }
    }),
    prisma.opportunity.count({ where })
  ]);

  return { data, total };
}

/**
 * Moves an opportunity to a new stage and automatically updates its probability.
 */
export async function moveStage(companyId: string, id: string, userId: string, stageId: string) {
  const stage = await prisma.opportunityStage.findFirst({ where: { id: stageId, companyId } });
  if (!stage) throw new Error("Stage not found");

  const opportunity = await updateOpportunity(companyId, id, userId, {
    stageId,
    probability: stage.winProbability
  });

  await addActivity(companyId, userId, id, "STAGE_MOVED", "Stage Updated", `Opportunity moved to stage: ${stage.name}`);

  return opportunity;
}

/**
 * Updates probability of winning.
 */
export async function updateProbability(companyId: string, id: string, userId: string, probability: number) {
  const opportunity = await updateOpportunity(companyId, id, userId, { probability });
  await addActivity(companyId, userId, id, "PROBABILITY_UPDATED", "Probability Updated", `Win probability adjusted to ${probability}%`);
  return opportunity;
}

/**
 * Marks opportunity as WON.
 */
export async function markWon(companyId: string, id: string, userId: string) {
  const opportunity = await updateOpportunity(companyId, id, userId, {
    status: OpportunityStatus.WON,
    probability: 100
  });

  await addActivity(companyId, userId, id, "STATUS_WON", "Opportunity Won", "Opportunity successfully won. Ready for Quotation/Sales Order.");

  return opportunity;
}

/**
 * Marks opportunity as LOST.
 */
export async function markLost(companyId: string, id: string, userId: string, reason?: string) {
  const opportunity = await updateOpportunity(companyId, id, userId, {
    status: OpportunityStatus.LOST,
    probability: 0,
    lostReason: reason
  });

  await addActivity(companyId, userId, id, "STATUS_LOST", "Opportunity Lost", reason || "Opportunity lost.");

  return opportunity;
}

/**
 * Archives an opportunity.
 */
export async function archiveOpportunity(companyId: string, id: string, userId: string) {
  const opportunity = await updateOpportunity(companyId, id, userId, {
    status: OpportunityStatus.ARCHIVED
  });
  await addActivity(companyId, userId, id, "ARCHIVED", "Opportunity Archived", "Opportunity was archived.");
  return opportunity;
}

/**
 * Restores an opportunity to OPEN.
 */
export async function restoreOpportunity(companyId: string, id: string, userId: string) {
  const opportunity = await updateOpportunity(companyId, id, userId, {
    status: OpportunityStatus.OPEN
  });
  await addActivity(companyId, userId, id, "RESTORED", "Opportunity Restored", "Opportunity was restored to Open status.");
  return opportunity;
}

/**
 * Retrieves the pipeline overview metrics.
 */
export async function getPipeline(companyId: string, pipelineId?: string) {
  const where: any = { companyId };
  if (pipelineId) where.pipelineId = pipelineId;

  const stages = await prisma.opportunityStage.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
    include: {
      opportunities: {
        where: { status: OpportunityStatus.OPEN },
        select: { id: true, estimatedRevenue: true, probability: true }
      }
    }
  });

  return stages.map(stage => {
    const opps = stage.opportunities;
    const totalRevenue = opps.reduce((sum, opp) => sum + Number(opp.estimatedRevenue), 0);
    const weightedRevenue = opps.reduce((sum, opp) => sum + (Number(opp.estimatedRevenue) * opp.probability / 100), 0);
    
    return {
      id: stage.id,
      name: stage.name,
      opportunityCount: opps.length,
      totalRevenue,
      weightedRevenue
    };
  });
}

/**
 * Dashboard metrics for Opportunities.
 */
export async function getOpportunityDashboard(companyId: string) {
  const allOpps = await prisma.opportunity.findMany({
    where: { companyId },
    select: { id: true, estimatedRevenue: true, probability: true, status: true }
  });

  const totalOpps = allOpps.length;
  let pipelineValue = 0;
  let weightedForecast = 0;
  let wonValue = 0;
  let lostValue = 0;
  let wonCount = 0;
  let closedCount = 0;

  allOpps.forEach(opp => {
    const rev = Number(opp.estimatedRevenue);
    if (opp.status === OpportunityStatus.OPEN) {
      pipelineValue += rev;
      weightedForecast += (rev * opp.probability) / 100;
    } else if (opp.status === OpportunityStatus.WON) {
      wonValue += rev;
      wonCount++;
      closedCount++;
    } else if (opp.status === OpportunityStatus.LOST) {
      lostValue += rev;
      closedCount++;
    }
  });

  const conversionRate = closedCount > 0 ? ((wonCount / closedCount) * 100).toFixed(2) : 0;

  return {
    totalOpportunities: totalOpps,
    pipelineValue,
    weightedForecast,
    wonValue,
    lostValue,
    conversionRate
  };
}

/**
 * Adds an activity to an opportunity.
 */
export async function addActivity(
  companyId: string,
  userId: string,
  opportunityId: string,
  activityType: string,
  subject: string,
  description?: string,
  attachments: string[] = []
) {
  return await prisma.opportunityActivity.create({
    data: {
      opportunityId,
      activityType,
      subject,
      description,
      attachments,
      createdById: userId,
    }
  });
}

/**
 * Retrieves audit history for a specific opportunity.
 */
export async function getOpportunityHistory(companyId: string, id: string) {
  return await prisma.globalAuditLog.findMany({
    where: {
      companyId,
      module: "CRM",
      entityType: "Opportunity",
      entityId: id,
    },
    orderBy: { createdAt: 'desc' }
  });
}
