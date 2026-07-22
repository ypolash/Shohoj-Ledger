import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const employees = await prisma.employee.findMany({
      where: await withCompany(),
      orderBy: { createdAt: 'desc' },
      include: {
        departmentRef: true,
        designationRef: true,
        reportingManager: true
      }
    });
    return NextResponse.json(employees);
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

    // Auto-generate employeeId (e.g. EMP-1001)
    const count = await prisma.employee.count({ where: { ...(await withCompany()) } });
    const employeeId = `EMP-${1000 + count + 1}`;

    const hashedPassword = await bcrypt.hash(data.password, 10);

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
      }
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
