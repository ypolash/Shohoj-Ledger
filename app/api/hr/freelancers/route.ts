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
          { employmentType: { in: ['Freelance', 'Project-Based', 'Contractor', 'Freelancer', 'Editor'] } },
          { department: { in: ['Freelance', 'Post-Production', 'Creative Freelance', 'Video Editing'] } },
          { designation: { contains: 'Freelance', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        projectEmployees: {
          include: {
            project: {
              select: { id: true, name: true, status: true }
            }
          }
        }
      }
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
        role: emp.designation || 'Freelancer',
        department: emp.department || 'Freelance',
        rate: Number(emp.basicSalary) || 0,
        status: emp.status || 'ACTIVE',
        skills: extraData.skills || ['Video Editing', 'Color Grading'],
        portfolioUrl: extraData.portfolioUrl || '',
        notes: extraData.notes || '',
        activeProjectsCount: emp.projectEmployees?.filter((pe: any) => pe.project?.status !== 'Completed').length || 0,
        joinedAt: emp.joinDate ? emp.joinDate.toISOString() : emp.createdAt.toISOString(),
        createdAt: emp.createdAt.toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch freelancers:', error);
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
      return NextResponse.json({ error: 'Freelancer name is required' }, { status: 400 });
    }

    const nameParts = fullName.split(' ');
    const firstName = data.firstName || nameParts[0] || 'Freelancer';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || '';
    const email = (data.email || `freelance.${Date.now()}@shohoj.local`).trim().toLowerCase();
    const role = data.role || data.designation || 'Freelance Video Editor';
    const rate = Number(data.rate) || 0;
    const skills = Array.isArray(data.skills) ? data.skills : (data.skills ? String(data.skills).split(',').map(s => s.trim()) : ['Video Editing']);
    const portfolioUrl = (data.portfolioUrl || '').trim();
    const notes = (data.notes || '').trim();
    const status = data.status || 'ACTIVE';

    const employeeId = `FL-${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(`FL@${Date.now()}`, 10);

    const extraMetadata = JSON.stringify({
      skills,
      portfolioUrl,
      notes,
      type: 'FREELANCER'
    });

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        phone: data.phone || null,
        designation: role,
        department: 'Freelance',
        joinDate: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        basicSalary: rate,
        employmentType: 'Freelance',
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
      role: employee.designation,
      department: employee.department,
      rate: Number(employee.basicSalary) || 0,
      status: employee.status,
      skills,
      portfolioUrl,
      notes,
      joinedAt: employee.joinDate.toISOString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create freelancer:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A freelancer with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create freelancer' }, { status: 500 });
  }
}
