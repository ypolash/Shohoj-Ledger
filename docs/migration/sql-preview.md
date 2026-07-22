# SQL Preview

## Expected Migration Order
1. Create Enums (`PlatformRole`, `BusinessType`, `CompanyStatus`).
2. Create Core Tenant Tables (`Company`, `CompanySetting`, `Module`, `CompanyModule`, `Role`, `Permission`, `RolePermission`).
3. Alter Existing Business Tables to add `companyId`.
4. Create Indexes on `companyId`.
5. Add Foreign Key Constraints linking to `Company(id)`.

## Expected ALTER TABLE Operations
- `ALTER TABLE "User" ADD COLUMN "companyId" TEXT, ADD COLUMN "platformRole" "PlatformRole";`
- `ALTER TABLE "Project" ADD COLUMN "companyId" TEXT;`
- *(Repeated for all 22 other models)*

## Expected CREATE TABLE Operations
- `CREATE TABLE "Company" (...)`
- `CREATE TABLE "CompanySetting" (...)`
- `CREATE TABLE "Module" (...)`
- `CREATE TABLE "CompanyModule" (...)`
- `CREATE TABLE "Role" (...)`
- `CREATE TABLE "Permission" (...)`
- `CREATE TABLE "RolePermission" (...)`

## Expected INDEX Creation Order
- `CREATE INDEX "User_companyId_idx" ON "User"("companyId");`
- `CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");`
- *(Repeated for all other models)*
