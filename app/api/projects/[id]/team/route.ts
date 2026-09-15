import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { verifyOwnership } from "@/lib/company/verifyOwnership";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const projectId = params.id;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const projectEmployees = await (prisma as any).projectEmployee.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            employmentType: true,
            basicSalary: true
          }
        }
      }
    });

    return NextResponse.json({ projectEmployees });
  } catch (error) {
    console.error("GET Project Team Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const projectId = params.id;

  try {
    const ownershipGuard = await verifyOwnership("project", projectId);
    if (ownershipGuard) return ownershipGuard;

    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { members } = body; // Array of { employeeId, rate, isProjectBased }

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: "No members provided" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: { teamMembers: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const assignedNames: string[] = [];

    await prisma.$transaction(async (tx: any) => {
      for (const m of members) {
        if (!m.employeeId) continue;

        const employee = await tx.employee.findFirst({
          where: { id: m.employeeId, companyId }
        });

        if (!employee) continue;
        assignedNames.push(`${employee.firstName} ${employee.lastName}`);

        const isProjectBased = m.isProjectBased ?? (employee.employmentType === "Project-Based");
        const rate = m.rate !== undefined ? parseFloat(m.rate) : (isProjectBased ? Number(employee.basicSalary || 0) : 0);

        // Upsert ProjectEmployee
        await tx.projectEmployee.upsert({
          where: {
            projectId_employeeId: {
              projectId,
              employeeId: employee.id
            }
          },
          update: {
            rate: rate >= 0 ? rate : 0,
            isProjectBased
          },
          create: {
            projectId,
            employeeId: employee.id,
            rate: rate >= 0 ? rate : 0,
            paidAmount: 0,
            isProjectBased
          }
        });

        // Ensure connected in legacy teamMembers relation
        await tx.project.update({
          where: { id: projectId },
          data: {
            teamMembers: {
              connect: { id: employee.id }
            }
          }
        });
      }

      // Log activity
      if (assignedNames.length > 0) {
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId,
            type: "TEAM_ASSIGNED",
            description: `Assigned ${assignedNames.length} member(s): ${assignedNames.join(", ")}`,
            performedById: session.user.id
          }
        });
      }
    });

    const updated = await (prisma as any).projectEmployee.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            employmentType: true,
            basicSalary: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Assigned ${assignedNames.length} team members`,
      projectEmployees: updated
    }, { status: 200 });
  } catch (error) {
    console.error("POST Project Team Error:", error);
    return NextResponse.json({ error: "Failed to assign team members" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const projectId = params.id;

  try {
    const ownershipGuard = await verifyOwnership("project", projectId);
    if (ownershipGuard) return ownershipGuard;

    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) return NextResponse.json({ error: "Employee ID required" }, { status: 400 });

    await prisma.$transaction(async (tx: any) => {
      await tx.projectEmployee.deleteMany({
        where: { projectId, employeeId }
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          teamMembers: {
            disconnect: { id: employeeId }
          }
        }
      });

      await tx.projectActivity.create({
        data: {
          companyId,
          projectId,
          type: "TEAM_REMOVED",
          description: `Removed collaborator from project`,
          performedById: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true, message: "Member removed from project" });
  } catch (error) {
    console.error("DELETE Project Team Error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
