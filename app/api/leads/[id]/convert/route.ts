import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("LEAD_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "LEAD_MANAGEMENT");
  if (moduleGuard) return moduleGuard;

  try {
    const { id } = await params;

    // 1. Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { ...(await withCompany()), id }
    });

    if (!lead) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    if (lead.status !== "Won") {
      return NextResponse.json({ success: false, message: "Only won leads can be converted" }, { status: 400 });
    }

    // Run in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2. Create the project
      const project = await tx.project.create({
        data: {
          name: `${lead.serviceType} for ${lead.companyName}`,
          clientName: lead.companyName,
          status: "ACTIVE"
        }
      });

      // 3. Create income record (UNPAID initially)
      const income = await tx.income.create({
        data: {
          projectId: project.id,
          category: lead.serviceType,
          source: lead.companyName,
          amount: lead.expectedValue,
          received: 0,
          paymentStatus: "UNPAID",
          shareable: true,
          description: `Converted from lead ${lead.serialNumber}: ${lead.serviceType}`,
        }
      });

      // 3.5 Update Lead status to Converted
      await tx.lead.update({
        where: { ...(await withCompany()), id: lead.id },
        data: { status: "Converted" }
      });

      // 4. Invalidate Settlement for this month
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[new Date(income.createdAt).getMonth()];
      const yearName = new Date(income.createdAt).getFullYear();
      const period = `${monthName} ${yearName}`;
      await tx.settlement.deleteMany({ where: { ...(await withCompany()), period } });

      return { project, income };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error converting lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
