import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export const customerContactService = {
  addContact: async (companyId: string, userId: string, customerId: string, data: any) => {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });
    if (!customer) throw new Error("Customer not found or access denied");

    // If this is the first contact or marked as primary, unmark others
    if (data.isPrimary) {
      await prisma.customerContact.updateMany({
        where: { customerId, companyId },
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.customerContact.create({
      data: {
        ...data,
        customerId,
        companyId,
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerContact",
      entityId: contact.id,
      action: "CREATE",
      description: `Added contact ${contact.name} for customer ${customer.customerCode}`,
      afterValue: contact,
    });

    return contact;
  },

  updateContact: async (companyId: string, id: string, data: any) => {
    const existing = await prisma.customerContact.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    if (data.isPrimary && !existing.isPrimary) {
      await prisma.customerContact.updateMany({
        where: { customerId: existing.customerId, companyId },
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.customerContact.update({
      where: { id },
      data,
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerContact",
      entityId: id,
      action: "UPDATE",
      description: `Updated contact ${contact.name}`,
      beforeValue: existing,
      afterValue: contact,
    });

    return contact;
  },

  removeContact: async (companyId: string, id: string) => {
    const existing = await prisma.customerContact.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    await prisma.customerContact.delete({
      where: { id }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerContact",
      entityId: id,
      action: "DELETE",
      description: `Removed contact ${existing.name}`,
      beforeValue: existing,
    });

    return true;
  }
};
