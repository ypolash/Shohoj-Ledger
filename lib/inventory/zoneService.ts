import prisma from "@/lib/prisma";

export const zoneService = {
  createZone: async (data: {
    warehouseId: string;
    code: string;
    name: string;
    description?: string;
  }) => {
    return prisma.warehouseZone.create({
      data
    });
  },

  updateZone: async (id: string, warehouseId: string, data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
  }>) => {
    return prisma.warehouseZone.update({
      where: { id, warehouseId },
      data
    });
  },

  listZones: async (warehouseId: string) => {
    return prisma.warehouseZone.findMany({
      where: { warehouseId },
      include: {
        _count: { select: { bins: true } }
      }
    });
  }
};
