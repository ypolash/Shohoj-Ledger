import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export const opportunityPipelineService = {
  createPipeline: async (companyId: string, userId: string, data: any) => {
    // Check for existing pipeline with same name
    const existing = await prisma.opportunityPipeline.findFirst({
      where: { name: data.name, companyId }
    });
    if (existing) throw new Error("Pipeline with this name already exists");

    // If marked as default, unset others
    if (data.isDefault) {
      await prisma.opportunityPipeline.updateMany({
        where: { companyId },
        data: { isDefault: false }
      });
    }

    const pipeline = await prisma.opportunityPipeline.create({
      data: {
        ...data,
        companyId,
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "OpportunityPipeline",
      entityId: pipeline.id,
      action: "CREATE",
      description: `Created pipeline ${pipeline.name}`,
      afterValue: pipeline,
    });

    return pipeline;
  },

  updatePipeline: async (companyId: string, id: string, userId: string, data: any) => {
    const existing = await prisma.opportunityPipeline.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    if (data.name && data.name !== existing.name) {
      const nameCheck = await prisma.opportunityPipeline.findFirst({
        where: { name: data.name, companyId }
      });
      if (nameCheck) throw new Error("Pipeline with this name already exists");
    }

    if (data.isDefault && !existing.isDefault) {
      await prisma.opportunityPipeline.updateMany({
        where: { companyId },
        data: { isDefault: false }
      });
    }

    const pipeline = await prisma.opportunityPipeline.update({
      where: { id },
      data,
    });

    await logAudit({
      module: "CRM",
      entityType: "OpportunityPipeline",
      entityId: id,
      action: "UPDATE",
      description: `Updated pipeline ${pipeline.name}`,
      beforeValue: existing,
      afterValue: pipeline,
    });

    return pipeline;
  },

  deletePipeline: async (companyId: string, id: string) => {
    const existing = await prisma.opportunityPipeline.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { opportunities: true } }
      }
    });
    if (!existing) throw new Error("Record not found or access denied");
    
    if (existing._count.opportunities > 0) {
      throw new Error("Cannot delete pipeline with active opportunities");
    }

    await prisma.opportunityPipeline.delete({
      where: { id }
    });

    await logAudit({
      module: "CRM",
      entityType: "OpportunityPipeline",
      entityId: id,
      action: "DELETE",
      description: `Deleted pipeline ${existing.name}`,
      beforeValue: existing,
    });

    return true;
  },

  getPipelines: async (companyId: string) => {
    return prisma.opportunityPipeline.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { opportunities: true, stages: true } },
        stages: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
  }
};
