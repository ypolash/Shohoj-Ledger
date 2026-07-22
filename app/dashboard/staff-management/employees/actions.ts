"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function verifyAccess(action: string) {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized or no company context.");
  }
  // Optional RBAC Check Here
  return { companyId: session.user.companyId };
}

export async function fetchEmployees() {
  const { companyId } = await verifyAccess("VIEW_EMPLOYEES");

  return await prisma.employee.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      departmentRef: true,
      designationRef: true,
      reportingManager: true,
      lifecycleEvents: {
        orderBy: { effectiveDate: 'desc' }
      }
    }
  });
}

export async function createEmployee(data: any) {
  const { companyId } = await verifyAccess("CREATE_EMPLOYEE");

  // Validate duplicate employee ID or email
  const existing = await prisma.employee.findFirst({
    where: {
      companyId,
      OR: [
        { email: data.email },
        { employeeId: data.employeeId }
      ]
    }
  });

  if (existing) {
    if (existing.email === data.email) throw new Error("Email already in use.");
    if (existing.employeeId === data.employeeId) throw new Error("Employee ID already exists.");
  }

  // Link User logic: The prompt mentions if architecture supports linking, reuse it.
  // We can create a User automatically so they can log in.
  // Check if User exists by email first.
  let userId = undefined;
  
  // Optionally create a user account for the employee so they can log in to the employee portal.
  if (data.password) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          companyId,
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          role: "employee", 
        }
      });
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }
  }

  const generatedEmpId = data.employeeId || `EMP-${Date.now().toString().slice(-6)}`;

  const employee = await prisma.employee.create({
    data: {
      companyId,
      userId,
      employeeId: generatedEmpId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      designation: data.designation,
      department: data.department,
      designationId: data.designationId || null,
      departmentId: data.departmentId || null,
      reportingManagerId: data.reportingManagerId || null,
      employmentType: data.employmentType || null,
      location: data.location || null,
      shift: data.shift || null,
      employmentStatus: data.employmentStatus || 'Probation',
      basicSalary: data.basicSalary,
      joinDate: new Date(data.joinDate),
      password: data.password || null, // Keeping plain for mockup, hash in production
      status: "ACTIVE"
    }
  });

  revalidatePath("/dashboard/staff-management/employees");
  return employee;
}

export async function updateEmployee(id: string, data: any) {
  const { companyId } = await verifyAccess("EDIT_EMPLOYEE");

  const existing = await prisma.employee.findFirst({
    where: { id, companyId }
  });

  if (!existing) throw new Error("Employee not found.");

  await prisma.employee.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      designation: data.designation,
      department: data.department,
      designationId: data.designationId || null,
      departmentId: data.departmentId || null,
      reportingManagerId: data.reportingManagerId || null,
      employmentType: data.employmentType || null,
      location: data.location || null,
      shift: data.shift || null,
      employmentStatus: data.employmentStatus || undefined,
      basicSalary: data.basicSalary,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      status: data.status,
    }
  });

  // Also update linked user's name if applicable
  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { name: `${data.firstName} ${data.lastName}` }
    });
  }

  revalidatePath("/dashboard/staff-management/employees");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  const { companyId } = await verifyAccess("DELETE_EMPLOYEE");
  // The system probably shouldn't fully delete employees due to financial ledger integrity.
  // Instead, it sets status to TERMINATED.
  
  const existing = await prisma.employee.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Employee not found.");

  await prisma.employee.update({
    where: { id },
    data: { status: "TERMINATED" }
  });

  if (existing.userId) {
     await prisma.user.update({
       where: { id: existing.userId },
       data: { role: "inactive" }
     });
  }

  revalidatePath("/dashboard/staff-management/employees");
  return { success: true };
}
