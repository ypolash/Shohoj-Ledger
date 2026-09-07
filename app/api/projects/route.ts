import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");
    const managerId = url.searchParams.get("managerId");
    const client = url.searchParams.get("client");

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const where: any = { companyId, systemSource };
    
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;
    
    if (search || client) {
      const q = search || client;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } },
        { clientName: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { select: { firstName: true, lastName: true } },
        teamMembers: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: { select: { id: true, status: true, estimatedHours: true, actualHours: true } }
      }
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      projectCode, name, description, category, priority, 
      clientName, leadId, managerId, teamMemberIds, 
      startDate, endDate, estimatedBudget, actualCost, tags 
    } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedCode = typeof projectCode === "string" ? projectCode.trim() : "";

    if (!trimmedName || !trimmedCode) {
      return NextResponse.json({ error: "Project Name and Project Code are required." }, { status: 400 });
    }

    // Duplicate Check for Project Code
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.project.findFirst({
      where: {
        companyId,
        projectCode: trimmedCode
      }
    });

    if (existing) {
      return NextResponse.json({ error: `A project with code "${trimmedCode}" already exists.` }, { status: 400 });
    }

    // Sanitize Foreign Keys & Optional Values to avoid database constraint violations
    let validManagerId: string | null = null;
    if (typeof managerId === "string" && managerId.trim().length > 0) {
      const emp = await prisma.employee.findFirst({
        where: { id: managerId.trim(), companyId }
      });
      if (emp) validManagerId = emp.id;
    }

    let validLeadId: string | null = null;
    if (typeof leadId === "string" && leadId.trim().length > 0) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId.trim(), companyId }
      });
      if (lead) validLeadId = lead.id;
    }

    const parseDate = (val: any): Date | null => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    const parsedBudget = (estimatedBudget !== undefined && estimatedBudget !== null && estimatedBudget !== "" && !isNaN(Number(estimatedBudget)))
      ? Number(estimatedBudget)
      : null;

    const parsedActualCost = (actualCost !== undefined && actualCost !== null && actualCost !== "" && !isNaN(Number(actualCost)))
      ? Number(actualCost)
      : 0;

    // Filter valid team members
    let validTeamMembers: { id: string }[] = [];
    if (Array.isArray(teamMemberIds) && teamMemberIds.length > 0) {
      const ids = teamMemberIds.filter((id: any) => typeof id === "string" && id.trim().length > 0);
      if (ids.length > 0) {
        const found = await prisma.employee.findMany({
          where: { id: { in: ids }, companyId },
          select: { id: true }
        });
        validTeamMembers = found.map(f => ({ id: f.id }));
      }
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          companyId,
          projectCode: trimmedCode,
          name: trimmedName,
          description: description?.trim() || null,
          category: category?.trim() || null,
          priority: priority || "Medium",
          status: "Draft",
          clientName: clientName?.trim() || null,
          leadId: validLeadId,
          managerId: validManagerId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          estimatedBudget: parsedBudget,
          actualCost: parsedActualCost,
          tags: Array.isArray(tags) ? tags : [],
          systemSource,
          teamMembers: {
            connect: validTeamMembers
          }
        }
      });

      // Safely log activity if performing user exists in User table
      const performingUser = await tx.user.findUnique({
        where: { id: session.user.id }
      });

      if (performingUser) {
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: p.id,
            type: "PROJECT_CREATED",
            description: `Project ${trimmedCode} created`,
            performedById: session.user.id
          }
        });

        if (validManagerId) {
          await tx.projectActivity.create({
            data: {
              companyId,
              projectId: p.id,
              type: "PROJECT_UPDATED",
              description: "Manager assigned",
              newValue: validManagerId,
              performedById: session.user.id
            }
          });
        }
      }

      // -------------------------------------------------------------
      // NOTIFICATIONS: Notify manager and team members of assignment
      // -------------------------------------------------------------
      const assignedEmployeeIds = new Set<string>();
      if (validManagerId) assignedEmployeeIds.add(validManagerId);
      validTeamMembers.forEach(m => assignedEmployeeIds.add(m.id));

      if (assignedEmployeeIds.size > 0) {
        const employeesToNotify = await tx.employee.findMany({
          where: { id: { in: Array.from(assignedEmployeeIds) }, companyId, userId: { not: null } },
          select: { userId: true, id: true }
        });

        if (employeesToNotify.length > 0) {
          const notifications = employeesToNotify
            .filter(emp => !!emp.userId)
            .map(emp => ({
              companyId,
              userId: emp.userId!,
              title: "New Project Assignment",
              message: `You have been assigned to project: ${trimmedName} (${trimmedCode})`,
              category: "SYSTEM",
              priority: "NORMAL",
              status: "UNREAD",
              link: `/erp/projects/${p.id}`
            }));
          if (notifications.length > 0) {
            await tx.notification.createMany({ data: notifications });
          }
        }
      }

      return p;
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
