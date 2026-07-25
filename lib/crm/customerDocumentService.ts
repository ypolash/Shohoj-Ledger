import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/auditService";

export const customerDocumentService = {
  addDocument: async (companyId: string, userId: string, customerId: string, data: { title: string; fileUrl: string; type: string }) => {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });
    if (!customer) throw new Error("Customer not found or access denied");

    const document = await prisma.customerDocument.create({
      data: {
        ...data,
        customerId,
        companyId,
      }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerDocument",
      entityId: document.id,
      action: "CREATE",
      description: `Added document ${document.title} for customer ${customer.customerCode}`,
      afterValue: document,
    });

    return document;
  },

  removeDocument: async (companyId: string, id: string) => {
    const existing = await prisma.customerDocument.findFirst({
      where: { id, companyId }
    });
    if (!existing) throw new Error("Record not found or access denied");

    await prisma.customerDocument.delete({
      where: { id }
    });

    await logAudit({
      module: "CRM",
      entityType: "CustomerDocument",
      entityId: id,
      action: "DELETE",
      description: `Removed document ${existing.title}`,
      beforeValue: existing,
    });

    return true;
  },

  getDocuments: async (companyId: string, customerId: string) => {
    return prisma.customerDocument.findMany({
      where: { customerId, companyId },
      orderBy: { createdAt: 'desc' }
    });
  }
};
