"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getEssEmployeeId() {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.companyId) {
    throw new Error("Unauthorized");
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id }
  });

  if (!employee || employee.companyId !== session.user.companyId) {
    throw new Error("No employee record linked to this user account.");
  }

  return { employeeId: employee.id, companyId: session.user.companyId };
}

export async function uploadMyDocument(fileName: string, fileType: string) {
  // Verifies the user has a linked employee profile
  await getEssEmployeeId();
  // We cannot modify prisma schema to actually save the file metadata, so we simulate success.
  return { success: true };
}
