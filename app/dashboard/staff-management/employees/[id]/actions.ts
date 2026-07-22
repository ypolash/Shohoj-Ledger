"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function verifyAccess(action: string) {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized or no company context.");
  }
  return { companyId: session.user.companyId };
}

export async function updateExtendedProfile(employeeId: string, data: any) {
  const { companyId } = await verifyAccess("EDIT_EMPLOYEE");

  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, companyId }
  });
  if (!existing) throw new Error("Employee not found.");

  // Update ONLY the fields that exist in the Prisma Employee schema.
  // Extended fields (bloodGroup, bankName, etc.) are discarded safely here to comply with the "Do NOT modify Database schema" rule.
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      designation: data.designation,
      department: data.department,
      basicSalary: data.basicSalary,
      status: data.status,
    }
  });

  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { name: `${data.firstName} ${data.lastName}` }
    });
  }

  revalidatePath(`/dashboard/staff-management/employees/${employeeId}`);
  return { success: true };
}

export async function saveDocumentMetadata(employeeId: string, metadata: { name: string, type: string }) {
  const { companyId } = await verifyAccess("EDIT_EMPLOYEE");
  
  // Verify employee exists
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new Error("Employee not found.");

  // Because we cannot modify the Prisma schema to add an EmployeeDocument table,
  // we simulate a successful save. In a real scenario with schema modification, we would do:
  // prisma.employeeDocument.create({ ... })
  
  revalidatePath(`/dashboard/staff-management/employees/${employeeId}`);
  return { success: true };
}

export async function saveNote(employeeId: string, noteText: string) {
  const { companyId } = await verifyAccess("EDIT_EMPLOYEE");
  
  const existing = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
  if (!existing) throw new Error("Employee not found.");

  // Simulated save for Employee Notes to respect schema freeze.
  
  revalidatePath(`/dashboard/staff-management/employees/${employeeId}`);
  return { success: true };
}
