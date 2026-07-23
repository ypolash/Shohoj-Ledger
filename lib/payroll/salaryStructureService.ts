import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createSalaryStructure(companyId: string, data: any) {
  return prisma.salaryStructure.create({
    data: {
      ...data,
      companyId,
    }
  });
}

export async function addComponent(structureId: string, data: any) {
  return prisma.salaryComponent.create({
    data: {
      ...data,
      structureId
    }
  });
}

export async function assignToEmployee(employeeId: string, structureId: string, effectiveDate: Date) {
  // Deactivate old active structure
  await prisma.employeeSalary.updateMany({
    where: { employeeId, status: 'ACTIVE' },
    data: { status: 'INACTIVE', endDate: new Date() }
  });

  return prisma.employeeSalary.create({
    data: {
      employeeId,
      structureId,
      effectiveDate
    }
  });
}
