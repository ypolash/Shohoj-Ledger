import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const { id } = await context.params;
    const lifecycles = await prisma.employeeLifecycle.findMany({
      where: { ...(await withCompany()), employeeId: id },
      orderBy: { effectiveDate: 'desc' }
    });
    return NextResponse.json(lifecycles);
  } catch (error) {
    console.error("Error fetching employee lifecycles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    const { id: employeeId } = await context.params;
    
    if (!data.eventType || !data.effectiveDate) {
      return NextResponse.json({ error: 'Event Type and Effective Date are required' }, { status: 400 });
    }

    const companyId = await getCompanyId();

    // Verify employee exists and get current status
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, companyId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Determine new status based on event type
    let newStatus = employee.employmentStatus;
    let oldStatus = employee.employmentStatus;
    
    switch (data.eventType) {
      case 'HIRE':
        newStatus = 'Probation';
        break;
      case 'CONFIRM':
        newStatus = 'Confirmed';
        break;
      case 'SUSPEND':
        newStatus = 'Suspended';
        break;
      case 'REINSTATE':
        newStatus = 'Confirmed'; // Or whatever was before, simple implementation here
        break;
      case 'RESIGN':
        newStatus = 'Resigned';
        break;
      case 'TERMINATE':
        newStatus = 'Terminated';
        break;
      // PROMOTE, TRANSFER don't necessarily change employmentStatus, just other fields.
    }

    // Create lifecycle event and update employee in a transaction
    const [lifecycle, updatedEmployee] = await prisma.$transaction([
      prisma.employeeLifecycle.create({
        data: {
          companyId,
          employeeId,
          eventType: data.eventType,
          effectiveDate: new Date(data.effectiveDate),
          description: data.description || null,
          previousData: { status: oldStatus },
          newData: { status: newStatus, details: data.details || null }
        }
      }),
      prisma.employee.update({
        where: { id: employeeId },
        data: {
          employmentStatus: newStatus,
          // Could also update departmentId, designationId here if provided for TRANSFER/PROMOTE
          ...(data.departmentId && { departmentId: data.departmentId }),
          ...(data.designationId && { designationId: data.designationId }),
          ...(data.basicSalary && { basicSalary: data.basicSalary }),
        }
      })
    ]);

    return NextResponse.json({ lifecycle, employee: updatedEmployee }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create employee lifecycle event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
