import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getCompanyId } from "@/lib/company/companyFilter";
import bcrypt from 'bcryptjs';

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        OR: [
          { employmentType: { in: ['Model', 'Talent'] } },
          { department: { in: ['Model Talent', 'Fashion', 'Modeling Agency', 'Talent'] } },
          { designation: { contains: 'Model', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = employees.map(emp => {
      let extraData: any = {};
      try {
        if (emp.location && emp.location.startsWith('{')) {
          extraData = JSON.parse(emp.location);
        }
      } catch (e) {}

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        agency: extraData.agency || emp.department || 'Independent Talent',
        category: extraData.category || 'Commercial Model',
        rate: Number(emp.basicSalary) || 0,
        height: extraData.height || "5'8\"",
        measurements: extraData.measurements || '',
        gender: extraData.gender || 'Female',
        compCardUrl: extraData.compCardUrl || extraData.portfolioUrl || '',
        status: emp.status || 'ACTIVE',
        notes: extraData.notes || '',
        joinedAt: emp.joinDate ? emp.joinDate.toISOString() : emp.createdAt.toISOString(),
        createdAt: emp.createdAt.toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fullName = (data.name || '').trim();
    if (!fullName) {
      return NextResponse.json({ error: 'Model talent name is required' }, { status: 400 });
    }

    const nameParts = fullName.split(' ');
    const firstName = data.firstName || nameParts[0] || 'Model';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || 'Talent';
    const email = (data.email || `model.${Date.now()}@shohoj.local`).trim().toLowerCase();
    const agency = (data.agency || 'Independent Talent').trim();
    const category = (data.category || 'Commercial Model').trim();
    const rate = Number(data.rate) || 0;
    const height = (data.height || '').trim();
    const measurements = (data.measurements || '').trim();
    const gender = data.gender || 'Female';
    const compCardUrl = (data.compCardUrl || data.portfolioUrl || '').trim();
    const notes = (data.notes || '').trim();
    const status = data.status || 'ACTIVE';

    const employeeId = `MDL-${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(`MDL@${Date.now()}`, 10);

    const extraMetadata = JSON.stringify({
      agency,
      category,
      height,
      measurements,
      gender,
      compCardUrl,
      notes,
      type: 'MODEL_TALENT'
    });

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        phone: data.phone || null,
        designation: `${category} Model`,
        department: agency || 'Model Talent',
        joinDate: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        basicSalary: rate,
        employmentType: 'Model',
        employmentStatus: 'Active',
        status,
        location: extraMetadata,
        companyId,
        systemSource: 'ERP'
      }
    });

    return NextResponse.json({
      id: employee.id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email,
      phone: employee.phone,
      agency,
      category,
      rate: Number(employee.basicSalary) || 0,
      height,
      measurements,
      gender,
      compCardUrl,
      status: employee.status,
      notes,
      joinedAt: employee.joinDate.toISOString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create model:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A model with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}
