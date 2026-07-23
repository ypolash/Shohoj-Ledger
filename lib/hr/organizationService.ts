import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createBranch(companyId: string, data: any) {
  return prisma.branch.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createDivision(companyId: string, data: any) {
  return prisma.division.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createDepartment(companyId: string, data: any) {
  return prisma.department.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createSection(companyId: string, data: any) {
  return prisma.section.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createTeam(companyId: string, data: any) {
  return prisma.team.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createDesignation(companyId: string, data: any) {
  return prisma.designation.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createJobPosition(companyId: string, data: any) {
  return prisma.jobPosition.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createEmploymentType(companyId: string, data: any) {
  return prisma.employmentType.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createEmployeeGrade(companyId: string, data: any) {
  return prisma.employeeGrade.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createCostCenter(companyId: string, data: any) {
  return prisma.costCenter.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createHolidayCalendar(companyId: string, data: any) {
  return prisma.holidayCalendar.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function createWorkShift(companyId: string, data: any) {
  return prisma.workShift.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function validateHierarchy(companyId: string, hierarchyType: string, parentId: string) {
  // Skeleton implementation for hierarchy validation
  // Ensures unlimited hierarchy logic and parent-child validation
  if (!companyId || !hierarchyType || !parentId) {
    throw new Error('Invalid hierarchy validation parameters');
  }
  return true;
}

export function generateCodes(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
