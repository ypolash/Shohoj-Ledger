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
    const projectCode = url.searchParams.get("projectCode")?.trim() || "";
    const client = url.searchParams.get("client")?.trim() || url.searchParams.get("companyName")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";

    const where: any = { companyId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (projectCode) {
      where.projectCode = { contains: projectCode, mode: "insensitive" };
    }

    if (client) {
      where.clientName = { contains: client, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { projectCode: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        lead: {
          select: { id: true, companyName: true, contactPerson: true, phone: true, email: true },
        },
        teamMembers: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true },
        },
        tasks: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    const formattedProjects = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
      const calculatedProgress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.progress || 0);

      return {
        id: p.id,
        projectCode: p.projectCode || `PRJ-${p.id.slice(0, 6).toUpperCase()}`,
        name: p.name,
        companyName: p.clientName || p.lead?.companyName || "Internal Project",
        clientName: p.clientName || p.lead?.companyName || "Internal",
        clientContact: p.lead?.contactPerson || null,
        clientPhone: p.lead?.phone || null,
        clientEmail: p.lead?.email || null,
        description: p.description || "",
        status: p.status,
        priority: p.priority,
        budget: p.estimatedBudget ? Number(p.estimatedBudget) : 0,
        progress: calculatedProgress,
        startDate: p.startDate ? p.startDate.toISOString() : null,
        endDate: p.endDate ? p.endDate.toISOString() : null,
        managerName: p.manager ? `${p.manager.firstName} ${p.manager.lastName}`.trim() : "Unassigned",
        teamMembersCount: p.teamMembers.length,
        teamMembers: p.teamMembers.map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`.trim(),
          employeeId: m.employeeId,
          designation: m.designation,
        })),
        totalTasks,
        completedTasks,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: formattedProjects.length,
        projects: formattedProjects,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Projects] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
