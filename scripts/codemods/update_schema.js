const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const businessModels = [
  'Project', 'Income', 'Expense', 'FundTransaction', 'ReserveTransaction',
  'MemberLoan', 'Advance', 'Settlement', 'IncomeCategory', 'Member',
  'Employee', 'Task', 'Attendance', 'LeaveRequest', 'SalaryPayment',
  'SalaryDeduction', 'Bonus', 'Payslip', 'Lead', 'AllowedNetwork',
  'PunishmentSetting', 'AttendanceConfig'
];

// Add companyId String? to business models
for (const model of businessModels) {
  const regex = new RegExp(`(model ${model} {[\\s\\S]*?id\\s+String\\s+@[^\\n]*\\n)`, 'g');
  schema = schema.replace(regex, `$1  companyId       String?\n`);
}

// Update User
const userRegex = /(model User {[\s\S]*?id\s+String\s+@[^\n]*\n)/g;
schema = schema.replace(userRegex, `$1  companyId     String?\n  platformRole  PlatformRole @default(MEMBER)\n`);

// Append PlatformRole and new models
schema += `

enum PlatformRole {
  SUPER_ADMIN
  MEMBER
}

model Company {
  id             String           @id @default(uuid())
  name           String
  businessType   String
  status         String           @default("ACTIVE")
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  settings       CompanySetting?
  modules        CompanyModule[]
  roles          Role[]
}

model CompanySetting {
  id                 String   @id @default(uuid())
  companyId          String   @unique
  company            Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  currency           String   @default("BDT")
  timezone           String   @default("Asia/Dhaka")
  workingDays        Json
  weeklyHolidays     Json
  shiftStartTime     String
  shiftEndTime       String
  gracePeriodMinutes Int
}

model Module {
  id          String   @id @default(uuid())
  key         String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  companies   CompanyModule[]
}

model CompanyModule {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  moduleId  String
  module    Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  isActive  Boolean  @default(true)

  @@unique([companyId, moduleId])
}

model Role {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name        String
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  permissions RolePermission[]
}

model Permission {
  id        String   @id @default(uuid())
  action    String   @unique
  moduleKey String
  roles     RolePermission[]
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
`;

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully');
