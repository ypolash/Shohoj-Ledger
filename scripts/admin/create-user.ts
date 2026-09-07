import { PrismaClient } from '@prisma/client'
import bcrypt from "bcryptjs";
const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);
  const employee = await prisma.employee.create({
    data: {
      employeeId: 'EMP-688378',
      password: hashedPassword,
      firstName: 'Polash',
      lastName: 'Ahmed',
      email: 'polash@example.com',
      designation: 'Engineer',
      department: 'Tech',
      joinDate: new Date(),
      basicSalary: 1000,
      status: 'ACTIVE'
    }
  })
  console.log('Employee created:', employee)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
