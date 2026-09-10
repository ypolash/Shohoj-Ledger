import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId } = guard;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const priority = url.searchParams.get("priority")?.trim() || "";

    const where: any = { companyId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { serviceType: { contains: search, mode: "insensitive" } },
        { leadSource: { contains: search, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
      },
    });

    const formattedLeads = leads.map((l) => ({
      id: l.id,
      companyName: l.companyName,
      contactPerson: l.contactPerson,
      email: l.email || "",
      phone: l.phone || "",
      serviceType: l.serviceType || "Service",
      leadSource: l.leadSource || "Direct",
      status: l.status,
      priority: l.priority,
      estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : 0,
      assignedTo: l.assignedTo
        ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}`.trim()
        : "Unassigned",
      notes: l.notes || "",
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    // Status counts for pipeline tabs
    const statusCounts = {
      ALL: formattedLeads.length,
      NEW: leads.filter((l) => l.status === "NEW").length,
      CONTACTED: leads.filter((l) => l.status === "CONTACTED").length,
      QUALIFIED: leads.filter((l) => l.status === "QUALIFIED").length,
      PROPOSAL: leads.filter((l) => l.status === "PROPOSAL").length,
      WON: leads.filter((l) => l.status === "WON").length,
      LOST: leads.filter((l) => l.status === "LOST").length,
    };

    return NextResponse.json(
      {
        success: true,
        counts: statusCounts,
        leads: formattedLeads,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Leads] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
