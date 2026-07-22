import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, getSession } from "@/lib/auth";
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

    const where: any = { companyId };
    
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
  } catch (error) {
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
      startDate, endDate, estimatedBudget, tags 
    } = body;

    if (!name || !projectCode) {
      return NextResponse.json({ error: "Name and Project Code are required." }, { status: 400 });
    }

    // Duplicate Check for Project Code
    const existing = await prisma.project.findFirst({
      where: {
        companyId,
        projectCode
      }
    });

    if (existing) {
      return NextResponse.json({ error: "A project with this code already exists." }, { status: 400 });
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          companyId,
          projectCode,
          name,
          description,
          category,
          priority: priority || "Medium",
          status: "Draft",
          clientName,
          leadId,
          managerId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          estimatedBudget: estimatedBudget ? Number(estimatedBudget) : null,
          tags: tags || [],
          teamMembers: {
            connect: (teamMemberIds || []).map((id: string) => ({ id }))
          }
        }
      });

      await tx.projectActivity.create({
        data: {
          companyId,
          projectId: p.id,
          type: "PROJECT_CREATED",
          description: `Project ${projectCode} created`,
          performedById: session.user.id
        }
      });

      if (managerId) {
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: p.id,
            type: "PROJECT_UPDATED",
            description: "Manager assigned",
            newValue: managerId,
            performedById: session.user.id
          }
        });
      }

      return p;
    });

    return NextResponse.json({ project: newProject });
  } catch (error) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
