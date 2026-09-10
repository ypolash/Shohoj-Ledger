"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { RbacService } from "@/lib/rbac/rbacService";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

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

  const updateData: any = { name: data.name };
  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: updateData
  });
  
  revalidatePath("/erp/settings");
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

  // Synchronize AttendanceConfig so HR Attendance engine remains in lockstep
  const config = await prisma.attendanceConfig.findFirst({ where: { companyId } });
  if (config) {
    await prisma.attendanceConfig.update({
      where: { id: config.id },
      data: {
        shiftStart: data.shiftStartTime || config.shiftStart,
        shiftEnd: data.shiftEndTime || config.shiftEnd,
        gracePeriod: parseInt(data.gracePeriodMinutes) || config.gracePeriod,
      }
    });
  } else {
    await prisma.attendanceConfig.create({
      data: {
        companyId,
        shiftStart: data.shiftStartTime || "09:30",
        shiftEnd: data.shiftEndTime || "18:00",
        gracePeriod: parseInt(data.gracePeriodMinutes) || 15,
      }
    });
  }

  revalidatePath("/erp/settings");
  return { success: true };
}

export async function toggleModuleAction(moduleId: string, isActive: boolean) {
  const companyId = await getCompanyId();
  
  await prisma.companyModule.update({
    where: { companyId_moduleId: { companyId, moduleId } },
    data: { isActive }
  });

  revalidatePath("/erp/settings");
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

  revalidatePath("/erp/settings");
  return { success: true };
}

export async function assignUserRoleAction(userId: string, roleName: string) {
  const companyId = await getCompanyId();
  
  await prisma.user.update({
    where: { id: userId, companyId },
    data: { role: roleName }
  });

  revalidatePath("/erp/settings");
  return { success: true };
}

export async function createRoleAction(name: string) {
  const companyId = await getCompanyId();
  
  if (!name.trim()) throw new Error("Role name is required");
  
  await RbacService.createRole(companyId, name);
  revalidatePath("/erp/settings");
  return { success: true };
}

export async function deleteRoleAction(roleId: string) {
  const companyId = await getCompanyId();
  
  // verify role belongs to company inside service or here
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (role?.companyId !== companyId) throw new Error("Unauthorized");

  await RbacService.deleteRole(roleId);
  revalidatePath("/erp/settings");
  return { success: true };
}

export async function assignPermissionsAction(roleId: string, actions: string[]) {
  const companyId = await getCompanyId();
  
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (role?.companyId !== companyId) throw new Error("Unauthorized");

  await RbacService.assignPermissions(roleId, actions);
  revalidatePath("/erp/settings");
  return { success: true };
}

export async function getAuditLogs() {
  const companyId = await getCompanyId();
  
  const logs = await prisma.auditEvent.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return logs;
}

export async function createUserWithRoleAction(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const companyId = await getCompanyId();
  const email = formData.email.trim().toLowerCase();
  const name = formData.name.trim();
  const password = formData.password.trim();
  const role = formData.role || "Member";

  if (!email || !password || !name) {
    throw new Error("Name, email, and password are required.");
  }

  // Check duplicate email
  const existingUser = await prisma.user.findFirst({
    where: { email }
  });
  if (existingUser) {
    throw new Error("A user with this email address already exists.");
  }

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      role,
      companyId,
      platformRole: "USER"
    }
  });

  // Hash password and create Account
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.account.create({
    data: {
      userId: newUser.id,
      accountId: email,
      providerId: "credentials",
      password: hashedPassword
    }
  });

  // Create company Member record
  try {
    await prisma.member.create({
      data: {
        companyId,
        name,
        email,
        role,
        status: "ACTIVE"
      }
    });
  } catch (err) {
    console.warn("Member creation note:", err);
  }

  revalidatePath("/erp/settings/command-center");
  revalidatePath("/erp/settings/users");
  return { success: true, user: newUser };
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  const companyId = await getCompanyId();
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId }
  });
  if (!user) throw new Error("User not found or unauthorized");

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id }
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword }
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: "credentials",
        password: hashedPassword
      }
    });
  }

  revalidatePath("/erp/settings/command-center");
  revalidatePath("/erp/settings/users");
  return { success: true };
}
