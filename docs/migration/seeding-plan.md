# Seeding Plan

## Platform Seeders
These seeders run globally for the SaaS platform and are not tied to a specific company.
- **Modules:** Seed the default application modules (e.g., HR, Finance, CRM, Payroll, Attendance).
- **Permissions:** Seed the master list of granular permissions available per module (e.g., `view_employees`, `approve_payroll`).

## Company Seeders
These seeders are executed when a new tenant registers or during the legacy backfill.
- **Company Settings:** Generate default `CompanySetting` (currency, timezone, working days, grace period).
- **Roles:** Generate default roles (e.g., `Owner`, `Manager`, `Employee`) bound to the `companyId`.
- **Company Modules:** Assign standard activated modules to the `CompanyModule` table based on their subscription tier.

## Future Seeders
- **IT Company Template:** A pre-packaged seeder that populates typical IT industry designations, departments, policies, and project configurations to fast-track onboarding.
