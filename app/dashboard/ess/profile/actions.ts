"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";
import { revalidatePath } from "next/cache";

export async function fetchMyProfile() {
  const { employeeId, companyId } = await getEssEmployeeId();
  
  return await prisma.employee.findUnique({
    where: { id: employeeId, companyId }
  });
}

export async function updateMyProfile(data: any) {
  const { employeeId, companyId } = await getEssEmployeeId();

  const existing = await prisma.employee.findUnique({
    where: { id: employeeId, companyId }
  });
  if (!existing) throw new Error("Employee not found");

  // Only allow updating safe personal fields
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      phone: data.phone,
      // In a real app with extended schemas, fields like address, emergencyContact would be saved here.
    }
  });

  revalidatePath("/dashboard/ess/profile");
  return { success: true };
}
