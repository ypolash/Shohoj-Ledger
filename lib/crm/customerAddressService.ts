import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export const customerAddressService = {
  addAddress: async (companyId: string, userId: string, customerId: string, data: any) => {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });
    if (!customer) throw new Error("Customer not found or access denied");

    // If this is the first address or marked as default, unmark others
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId, companyId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        ...data,
        customerId,
        companyId,
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerAddress",
      entityId: address.id,
      action: "CREATE",
      description: `Added address for customer ${customer.customerCode}`,
      afterValue: address,
    });

    return address;
  },

  updateAddress: async (companyId: string, id: string, data: any) => {
    const existing = await prisma.customerAddress.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    if (data.isDefault && !existing.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: existing.customerId, companyId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data,
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerAddress",
      entityId: id,
      action: "UPDATE",
      description: `Updated address`,
      beforeValue: existing,
      afterValue: address,
    });

    return address;
  },

  removeAddress: async (companyId: string, id: string) => {
    const existing = await prisma.customerAddress.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    await prisma.customerAddress.delete({
      where: { id }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerAddress",
      entityId: id,
      action: "DELETE",
      description: `Removed address`,
      beforeValue: existing,
    });

    return true;
  }
};
