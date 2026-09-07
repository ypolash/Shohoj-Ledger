import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getSession } from "@/lib/session";
import { createLedgerEntry } from "@/lib/ledger";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const moduleGuard = await requireModule(companyId, "CRM");
    if (moduleGuard) return moduleGuard;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const channel = url.searchParams.get("channel");
    const status = url.searchParams.get("status");

    const where: any = { companyId };

    if (channel && channel !== "ALL") {
      where.channel = channel;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET Campaigns Error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyIdForGuard = await getCompanyId();
    const moduleGuard = await requireModule(companyIdForGuard, "CRM");
    if (moduleGuard) return moduleGuard;

    const body = await request.json();
    const { name, channel, spend, startDate, endDate, reach, conversions } = body;

    if (!name || spend === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaignSpend = parseFloat(spend) || 0;
    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Start a transaction to ensure both campaign and expense are created
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.create({
        data: {
          companyId: companyIdForGuard,
          name: name.trim(),
          channel: channel || "Social Media",
          spend: campaignSpend,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          status: "ACTIVE",
          reach: Number(reach) || 0,
          conversions: Number(conversions) || 0,
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
          description: `Campaign: ${name.trim()}`,
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
      description: `Expense Paid (Marketing Campaign): ${name.trim()}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(result.campaign, { status: 201 });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating marketing campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, reach, conversions } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(reach !== undefined ? { reach: Number(reach) } : {}),
        ...(conversions !== undefined ? { conversions: Number(conversions) } : {})
      }
    });

    return NextResponse.json({ campaign: updated });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH Campaign Error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
