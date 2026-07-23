import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createEmployee(companyId: string, data: any) {
  // Extract related entity arrays if they exist in the payload
  const { profile, addresses, emergencyContacts, education, experience, documents, reporting, ...employeeData } = data;
  
  return prisma.employee.create({
    data: {
      ...employeeData,
      companyId,
      profile: profile ? { create: profile } : undefined,
      addresses: addresses ? { create: addresses } : undefined,
      emergencyContacts: emergencyContacts ? { create: emergencyContacts } : undefined,
      education: education ? { create: education } : undefined,
      experience: experience ? { create: experience } : undefined,
      documents: documents ? { create: documents } : undefined,
      reporting: reporting ? { create: reporting } : undefined,
    },
    include: {
      profile: true,
      addresses: true,
    }
  });
}

export async function updateEmployee(employeeId: string, data: any) {
  return prisma.employee.update({
    where: { id: employeeId },
    data,
  });
}

export async function terminateEmployee(employeeId: string, companyId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: { status: 'TERMINATED' }
    });

    await tx.employeeLifecycle.create({
      data: {
        companyId,
        employeeId,
        eventType: 'TERMINATE',
        effectiveDate: new Date(),
        description: reason,
      }
    });

    return updated;
  });
}

export async function transferEmployee(employeeId: string, companyId: string, newBranchId: string, newDepartmentId: string) {
  return prisma.$transaction(async (tx) => {
    const oldEmp = await tx.employee.findUnique({ where: { id: employeeId }});
    
    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: {
        branchId: newBranchId,
        departmentId: newDepartmentId
      }
    });

    await tx.employeeLifecycle.create({
      data: {
        companyId,
        employeeId,
        eventType: 'TRANSFER',
        effectiveDate: new Date(),
        previousData: { branchId: oldEmp?.branchId, departmentId: oldEmp?.departmentId },
        newData: { branchId: newBranchId, departmentId: newDepartmentId }
      }
    });

    return updated;
  });
}

export async function promoteEmployee(employeeId: string, companyId: string, newDesignationId: string, newGradeId: string) {
  return prisma.$transaction(async (tx) => {
    const oldEmp = await tx.employee.findUnique({ where: { id: employeeId }});
    
    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: {
        designationId: newDesignationId,
        employeeGradeId: newGradeId
      }
    });

    await tx.employeeLifecycle.create({
      data: {
        companyId,
        employeeId,
        eventType: 'PROMOTE',
        effectiveDate: new Date(),
        previousData: { designationId: oldEmp?.designationId, gradeId: oldEmp?.employeeGradeId },
        newData: { designationId: newDesignationId, gradeId: newGradeId }
      }
    });

    return updated;
  });
}

export async function confirmEmployee(employeeId: string, companyId: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: { employmentStatus: 'Permanent' }
    });

    await tx.employeeLifecycle.create({
      data: {
        companyId,
        employeeId,
        eventType: 'CONFIRM',
        effectiveDate: new Date()
      }
    });

    return updated;
  });
}

export async function assignManager(employeeId: string, managerId: string, type: 'PRIMARY' | 'SECONDARY' = 'PRIMARY') {
  return prisma.employeeReporting.create({
    data: {
      employeeId,
      managerId,
      type
    }
  });
}

export async function assignDepartment(employeeId: string, departmentId: string) {
  return prisma.employee.update({
    where: { id: employeeId },
    data: { departmentId }
  });
}

export async function assignShift(employeeId: string, workShiftId: string) {
  return prisma.employee.update({
    where: { id: employeeId },
    data: { workShiftId }
  });
}

export async function uploadDocument(employeeId: string, type: string, fileUrl: string) {
  return prisma.employeeDocument.create({
    data: {
      employeeId,
      type,
      fileUrl
    }
  });
}

export async function getEmployeeHistory(employeeId: string) {
  return prisma.employeeLifecycle.findMany({
    where: { employeeId },
    orderBy: { effectiveDate: 'desc' }
  });
}

export async function validateEmployee(companyId: string, employeeId: string) {
  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, companyId }
  });
  if (!emp) throw new Error('Employee not found or access denied');
  return true;
}
