import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const binService = {
  createBin: async (data: {
    warehouseId: string;
    zoneId?: string;
    code: string;
    name: string;
    capacity?: Decimal | number;
  }) => {
    return prisma.warehouseBin.create({
      data
    });
  },

  updateBin: async (id: string, warehouseId: string, data: Partial<{
    zoneId: string;
    name: string;
    capacity: Decimal | number;
    isActive: boolean;
  }>) => {
    return prisma.warehouseBin.update({
      where: { id, warehouseId },
      data
    });
  },

  listBins: async (warehouseId: string, zoneId?: string) => {
    return prisma.warehouseBin.findMany({
      where: { 
        warehouseId,
        ...(zoneId && { zoneId })
      },
      include: {
        zone: true,
        _count: { select: { productWarehouses: true } }
      }
    });
  }
};
