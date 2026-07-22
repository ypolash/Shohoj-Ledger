"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { RbacService } from "@/lib/rbac/rbacService";
import { revalidatePath } from "next/cache";

async function getCompanyId() {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized or no company context.");
  }
  return session.user.companyId;
}

// --------------------------------------------------
// DATA LOADERS
// --------------------------------------------------
export async function loadAdminData() {
  const companyId = await getCompanyId();

  const [company, modules, users, roles, permissions] = await Promise.all([
    // Profile & Settings
    prisma.company.findUnique({
      where: { id: companyId },
      include: { settings: true }
    }),
    
    // Modules
    prisma.companyModule.findMany({
      where: { companyId },
      include: { module: true }
    }),

    // Users
    prisma.user.findMany({
      where: { companyId }
    }),

    // Roles & Assigned count
    prisma.role.findMany({
      where: { companyId },
      include: {
        permissions: { include: { permission: true } },
      }
    }),

    // All available platform permissions
    RbacService.listPermissions()
  ]);

  return { company, modules, users, roles, permissions };
}

// --------------------------------------------------
// MUTATIONS
// --------------------------------------------------

export async function updateProfile(data: any) {
  const companyId = await getCompanyId();
  
  if (!data.name?.trim()) throw new Error("Company Name is required.");

  await prisma.company.update({
    where: { id: companyId },
    data: { name: data.name }
  });
  
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateSettings(data: any) {
  const companyId = await getCompanyId();
  
  await prisma.companySetting.update({
    where: { companyId },
    data: {
      currency: data.currency,
      timezone: data.timezone,
      shiftStartTime: data.shiftStartTime,
      shiftEndTime: data.shiftEndTime,
      gracePeriodMinutes: parseInt(data.gracePeriodMinutes) || 15
    }
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleModuleAction(moduleId: string, isActive: boolean) {
  const companyId = await getCompanyId();
  
  await prisma.companyModule.update({
    where: { companyId_moduleId: { companyId, moduleId } },
    data: { isActive }
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deactivateUserAction(userId: string) {
  const companyId = await getCompanyId();
  
  // A crude "deactivate" logic could be dropping companyId or changing role. 
  // Let's set role = 'inactive' for the sake of the requirement
  await prisma.user.update({
    where: { id: userId, companyId },
    data: { role: 'inactive' }
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function assignUserRoleAction(userId: string, roleName: string) {
  const companyId = await getCompanyId();
  
  await prisma.user.update({
    where: { id: userId, companyId },
    data: { role: roleName }
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function createRoleAction(name: string) {
  const companyId = await getCompanyId();
  
  if (!name.trim()) throw new Error("Role name is required");
  
  await RbacService.createRole(companyId, name);
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteRoleAction(roleId: string) {
  const companyId = await getCompanyId();
  
  // verify role belongs to company inside service or here
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (role?.companyId !== companyId) throw new Error("Unauthorized");

  await RbacService.deleteRole(roleId);
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function assignPermissionsAction(roleId: string, actions: string[]) {
  const companyId = await getCompanyId();
  
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (role?.companyId !== companyId) throw new Error("Unauthorized");

  await RbacService.assignPermissions(roleId, actions);
  revalidatePath("/dashboard/settings");
  return { success: true };
}
