import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export const customerGroupService = {
  createCustomerGroup: async (companyId: string, userId: string, data: any) => {
    const existing = await prisma.customerGroup.findFirst({
      where: { name: data.name, companyId }
    });
    if (existing) throw new Error("Customer group with this name already exists");

    const group = await prisma.customerGroup.create({
      data: {
        ...data,
        companyId,
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerGroup",
      entityId: group.id,
      action: "CREATE",
      description: `Created customer group ${group.name}`,
      afterValue: group,
    });

    return group;
  },

  updateCustomerGroup: async (companyId: string, id: string, data: any) => {
    const existing = await prisma.customerGroup.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    if (data.name && data.name !== existing.name) {
      const nameCheck = await prisma.customerGroup.findFirst({
        where: { name: data.name, companyId }
      });
      if (nameCheck) throw new Error("Customer group with this name already exists");
    }

    const group = await prisma.customerGroup.update({
      where: { id },
      data,
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerGroup",
      entityId: id,
      action: "UPDATE",
      description: `Updated customer group ${group.name}`,
      beforeValue: existing,
      afterValue: group,
    });

    return group;
  },

  deleteCustomerGroup: async (companyId: string, id: string) => {
    const existing = await prisma.customerGroup.findFirst({
      where: { id, companyId },
      include: { _count: { select: { customers: true } } }
    });
    if (!existing) throw new Error("Record not found or access denied");
    
    if (existing._count.customers > 0) {
      throw new Error("Cannot delete group with assigned customers");
    }

    await prisma.customerGroup.delete({
      where: { id }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerGroup",
      entityId: id,
      action: "DELETE",
      description: `Deleted customer group ${existing.name}`,
      beforeValue: existing,
    });

    return true;
  },

  getGroups: async (companyId: string) => {
    return prisma.customerGroup.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });
  }
};
