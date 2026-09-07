import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const fields = (prisma as any)._runtimeDataModel.models.IncomeCategory.fields;
console.log(fields.map((f: any) => f.name));
