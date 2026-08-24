import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getSession } from "@/lib/session";
import { createLedgerEntry } from "@/lib/ledger";

export async function POST(request: Request) {
  try {
    const companyIdForGuard = await getCompanyId();
    const moduleGuard = await requireModule(companyIdForGuard, "CRM");
    if (moduleGuard) return moduleGuard;

    const body = await request.json();
    const { name, channel, spend, startDate } = body;

    if (!name || spend === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaignSpend = parseFloat(spend);
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Start a transaction to ensure both campaign and expense are created
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.create({
        data: {
          companyId: companyIdForGuard,
          name,
          channel,
          spend: campaignSpend,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: "ACTIVE",
          reach: 0,
          conversions: 0,
        }
      });

      // Create an expense for the marketing campaign
      const expense = await tx.expense.create({
        data: {
          companyId: companyIdForGuard,
          category: "Marketing",
          amount: campaignSpend,
          paymentMethod: "Bank",
          approvalStatus: "APPROVED",
          description: `Campaign: ${name}`,
          systemSource
        }
      });

      return { campaign, expense };
    });

    // Generate Ledger Entry
    const session = await getSession();
    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Expense',
      referenceId: result.expense.id,
      amount: campaignSpend,
      isDebit: false, // Credit Bank
      accountType: 'Bank',
      description: `Expense Paid (Marketing Campaign): ${name}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(result.campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating marketing campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
