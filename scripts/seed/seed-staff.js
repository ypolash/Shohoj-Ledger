const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  
  if (!company) {
    console.log("No company found. Please create a company first.");
    return;
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId: 'EMP_688378' }
  });

  if (existingEmployee) {
    console.log("Employee EMP_688378 already exists.");
    // Optionally update password to 'password123' just to be sure
    await prisma.employee.update({
      where: { employeeId: 'EMP_688378' },
      data: { password: 'password123' }
    });
    console.log("Password reset to 'password123' for existing employee.");
    return;
  }

  const employee = await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeId: 'EMP_688378',
      email: 'EMP_688378@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Employee',
      designation: 'Staff',
      joinDate: new Date(),
      basicSalary: 10000,
    },
  });

  console.log("Created test employee EMP_688378 with password 'password123':", employee);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
