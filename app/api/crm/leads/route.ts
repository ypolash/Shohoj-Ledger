import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_LEADS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const assignedToId = url.searchParams.get("assignedToId");
    const source = url.searchParams.get("source") || url.searchParams.get("leadSource");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const where: any = { companyId, systemSource };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (source) {
      where.OR = [
        { leadSource: { contains: source, mode: 'insensitive' } },
        { serviceType: { contains: source, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }
    
    if (search) {
      const searchFilter = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchFilter }
        ];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("GET Leads Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_LEADS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      companyName, contactPerson, phone, email, serviceType, 
      expectedValue, leadSource, assignedToId, expectedClosingDate, 
      priority, industry, website, address, tags, notes 
    } = body;

    if (!companyName || !contactPerson || !phone || !serviceType || expectedValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Duplicate Check
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.lead.findFirst({
      where: {
        companyId,
        systemSource,
        OR: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "A lead with this phone or email already exists." }, { status: 400 });
    }

    // Create Transaction to insert Lead and Activity simultaneously
    const newLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          companyId,
          companyName,
          contactPerson,
          phone,
          email,
          serviceType,
          expectedValue: Number(expectedValue),
          leadSource,
          assignedToId,
          expectedClosingDate: expectedClosingDate ? new Date(expectedClosingDate) : null,
          priority: priority || "Medium",
          industry,
          website,
          address,
          tags: tags || [],
          notes,
          status: "New",
          systemSource
        }
      });

      await tx.leadActivity.create({
        data: {
          companyId,
          leadId: lead.id,
          type: "CREATED",
          description: "Lead created",
          performedById: session.user.id
        }
      });

      if (assignedToId) {
        await tx.leadActivity.create({
          data: {
            companyId,
            leadId: lead.id,
            type: "ASSIGNED",
            description: "Assigned during creation",
            newValue: assignedToId,
            performedById: session.user.id
          }
        });
      }

      return lead;
    });

    return NextResponse.json({ lead: newLead });
  } catch (error) {
    console.error("POST Lead Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
