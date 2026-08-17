import { prisma } from "@/lib/prisma";

export async function getCompanyContext(userId: string, loginType: string) {
  if (loginType === "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, platformRole: true, role: true },
    });
    
    let roleId = null;
    let businessType = null;
    if (user?.companyId) {
       if (user.role) {
         const dbRole = await prisma.role.findFirst({
           where: { companyId: user.companyId, name: user.role }
         });
         if (dbRole) {
           roleId = dbRole.id;
         }
       }
       
       const company = await prisma.company.findUnique({
         where: { id: user.companyId },
         select: { businessType: true }
       });
       if (company) {
         businessType = company.businessType;
       }
    }

    return {
      companyId: user?.companyId || null,
      platformRole: user?.platformRole || null,
      roleId: roleId,
      dbRoleName: user?.role || null, // pass the actual string role to prevent overwrite
      businessType: businessType || 'Product + Service'
    };
  } else if (loginType === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: { companyId: true, designation: true }
    });
    
    let roleId = null;
    let businessType = null;
    // Attempt to map designation or default to "Employee" role
    const roleName = employee?.designation || "Employee";
    if (employee?.companyId) {
       const dbRole = await prisma.role.findFirst({
         where: { companyId: employee.companyId, name: roleName }
       });
       if (dbRole) {
         roleId = dbRole.id;
       } else {
         // Fallback to Employee role if designation doesn't match a role
         const fallbackRole = await prisma.role.findFirst({
           where: { companyId: employee.companyId, name: "Employee" }
         });
         if (fallbackRole) roleId = fallbackRole.id;
       }
       
       const company = await prisma.company.findUnique({
         where: { id: employee.companyId },
         select: { businessType: true }
       });
       if (company) {
         businessType = company.businessType;
       }
    }

    return {
      companyId: employee?.companyId || null,
      platformRole: null,
      roleId: roleId,
      dbRoleName: roleName,
      businessType: businessType || 'Product + Service'
    };
  }

  // Fallback
  return { companyId: null, platformRole: null, roleId: null, dbRoleName: null, businessType: 'Product + Service' };
}
