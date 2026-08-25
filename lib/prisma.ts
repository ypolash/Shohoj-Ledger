import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma_v3?: PrismaClient }

if (!globalForPrisma.prisma_v3 || !(globalForPrisma.prisma_v3 as any).customerReference) {
  globalForPrisma.prisma_v3 = new PrismaClient()
}

export const prisma = globalForPrisma.prisma_v3

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v3 = prisma

export default prisma;
