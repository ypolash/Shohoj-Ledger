import prisma from "@/lib/prisma";

export const warehouseService = {
  createWarehouse: async (data: {
    companyId: string;
    branchId?: string;
    code: string;
    name: string;
    description?: string;
    location?: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    isDefault?: boolean;
  }) => {
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: { companyId: data.companyId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.warehouse.create({
      data: {
        ...data,
        isDefault: data.isDefault || false
      }
    });
  },

  updateWarehouse: async (id: string, companyId: string, data: Partial<{
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    managerId: string;
    isDefault: boolean;
  }>) => {
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: { companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const existing = await prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    return prisma.warehouse.update({
      where: { id },
      data
    });
  },

  disableWarehouse: async (id: string, companyId: string) => {
    const existing = await prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Record not found or access denied");
    return prisma.warehouse.update({
      where: { id },
      data: { isActive: false, status: "INACTIVE" }
    });
  },

  listWarehouses: async (companyId: string, branchId?: string) => {
    return prisma.warehouse.findMany({
      where: { 
        companyId,
        ...(branchId && { branchId })
      },
      include: {
        manager: true,
        _count: {
          select: { zones: true, bins: true, productWarehouses: true }
        }
      }
    });
  },

  getDefaultWarehouse: async (companyId: string) => {
    return prisma.warehouse.findFirst({
      where: { companyId, isDefault: true }
    });
  }
};
