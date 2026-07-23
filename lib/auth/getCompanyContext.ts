import { prisma } from "@/lib/prisma";

export async function getCompanyContext(userId: string, role: string) {
  if (role === "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, platformRole: true }
    });
    return {
      companyId: user?.companyId || null,
      platformRole: user?.platformRole || null,
      roleId: null,
    };
  } else if (role === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });
    return {
      companyId: employee?.companyId || null,
      platformRole: null,
      roleId: null,
    };
  }

  // Fallback
  return { companyId: null, platformRole: null, roleId: null };
}
