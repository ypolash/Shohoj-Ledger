import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("PROJECT_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "PROJECTS");
  if (moduleGuard) return moduleGuard;

  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // To calculate profitability, we fetch related incomes and expenses for these projects
    // Note: projectId is stored as a string field in Income/Expense
    const projectIds = projects.map(p => p.id);
    
    const incomes = await prisma.income.groupBy({
      by: ['projectId'],
      where: { ...(await withCompany()), projectId: { in: projectIds }, paymentStatus: { in: ["PAID", "PARTIAL"] } },
      _sum: { received: true }
    });

    const expenses = await prisma.expense.groupBy({
      by: ['projectId'],
      where: { ...(await withCompany()), projectId: { in: projectIds }, approvalStatus: "APPROVED" },
      _sum: { amount: true }
    });

    // Map the totals back to the projects
    const projectsWithTotals = projects.map(project => {
      const incomeSum = incomes.find(i => i.projectId === project.id)?._sum.received || 0;
      const expenseSum = expenses.find(e => e.projectId === project.id)?._sum.amount || 0;
      return {
        ...project,
        totalIncome: Number(incomeSum),
        totalExpense: Number(expenseSum),
        profitability: Number(incomeSum) - Number(expenseSum)
      };
    });

    return NextResponse.json(projectsWithTotals);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("PROJECT_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "PROJECTS");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { name, clientName } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing project name" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        status: "ACTIVE",
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("PROJECT_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "PROJECTS");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { ...(await withCompany()), id },
      data: { status }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json({ error: "Failed to update project status" }, { status: 500 });
  }
}
