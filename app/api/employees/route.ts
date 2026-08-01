import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";
    
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employee.findMany({
      where: { companyId, systemSource },
      orderBy: { createdAt: 'desc' },
      include: {
        departmentRef: true,
        designationRef: true,
        reportingManager: true
      }
    });
    return NextResponse.json(JSON.parse(JSON.stringify(employees)));
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    
    if (!data.firstName || !data.lastName || !data.email || !data.designation || !data.basicSalary || !data.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate relational IDs if present
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: data.departmentId, companyId } });
      if (!dept) return NextResponse.json({ error: 'Invalid department or cross-tenant reference' }, { status: 403 });
    }
    if (data.designationId) {
      const desig = await prisma.designation.findFirst({ where: { id: data.designationId, companyId } });
      if (!desig) return NextResponse.json({ error: 'Invalid designation or cross-tenant reference' }, { status: 403 });
    }
    if (data.reportingManagerId) {
      const mgr = await prisma.employee.findFirst({ where: { id: data.reportingManagerId, companyId } });
      if (!mgr) return NextResponse.json({ error: 'Invalid manager or cross-tenant reference' }, { status: 403 });
    }

    // Auto-generate employeeId (e.g. EMP-1001)
    const count = await prisma.employee.count({ where: { companyId } });
    const employeeId = `EMP-${1000 + count + 1}`;

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        designation: data.designation,
        department: data.department || null,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
        basicSalary: data.basicSalary,
        companyId, // SECURITY HOTFIX: Tenant enforcement
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.designationId && { designationId: data.designationId }),
        ...(data.reportingManagerId && { reportingManagerId: data.reportingManagerId }),
        systemSource
      }
    });

    return NextResponse.json(JSON.parse(JSON.stringify(employee)), { status: 201 });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
