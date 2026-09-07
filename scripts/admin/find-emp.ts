import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const employee = await prisma.employee.findUnique({
    where: { employeeId: 'EMP-688378' }
  })
  console.log(JSON.stringify(employee, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
