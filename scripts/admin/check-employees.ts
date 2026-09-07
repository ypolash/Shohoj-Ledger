import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const employees = await prisma.employee.findMany({
    take: 5,
    select: { employeeId: true, firstName: true, lastName: true }
  })
  console.log(JSON.stringify(employees, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
