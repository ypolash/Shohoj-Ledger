import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const employee = await prisma.employee.upsert({
    where: { employeeId: 'EMP-1001' },
    update: {},
    create: {
      employeeId: 'EMP-1001',
      firstName: 'Minhaz',
      lastName: 'Ahmed',
      email: 'minhaz@example.com',
      designation: 'Software Engineer',
      department: 'Technology',
      joinDate: new Date('2023-01-01'),
      basicSalary: 50000,
      status: 'ACTIVE',
      phone: '01700000000',
    }
  })
  console.log('Employee created:', employee)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
