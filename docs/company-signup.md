# Company Signup and Onboarding Architecture

## Architecture
Phase 7 standardizes the creation of new tenants within the multi-company architecture. Rather than requiring manual database administration, the onboarding is entirely fully automated through a dedicated transactional backend service architecture (`lib/company/*`).

The system adopts a highly modular structure to prevent massive monolithic signup controllers, breaking the logic out into isolated responsibilities:
- `companyService.ts`: External API interface and high-level validation.
- `companySetup.ts`: The central transaction orchestrator.
- `moduleProvision.ts`: Handles enabling and mapping application features.
- `roleProvision.ts`: Handles default authorization groups.
- `templateProvision.ts`: Future-proofing for industry-specific data templates.

## Signup Flow
1. **Step 1:** Intake of Company Information (Name, Business Type).
2. **Step 2:** Module Selection based on the business type.
3. **Step 3:** Industry Template designation.
4. **Step 4:** Owner Credentials (Name, Email, Password).

## Provisioning Flow
During provisioning, the orchestrator triggers the following processes sequentially:
1. Validates the global uniqueness of the provided Owner email.
2. Creates the parent `Company` aggregate root.
3. Seeds default regional `CompanySetting` configurations (Timezone: `Asia/Dhaka`, Currency: `BDT`, Working Hours: `09:00 - 20:00`, Weekend: `Friday`).
4. Associates the chosen system modules via `CompanyModule`.
5. Creates standard internal `Role` definitions (`Owner`, `Admin`, `HR`, `Manager`, `Accountant`, `Employee`).
6. Provisions the primary `User` record mapped to the newly created `Company`.
7. Wraps the credentials securely inside the `Account` model using bcrypt hashing.
8. Passes execution to the Industry Template provider.

## Transaction Design & Rollback Strategy
The entire execution is strictly enveloped inside a single `prisma.$transaction`. 
- By enforcing ACID constraints, the database guarantees that a tenant is either perfectly fully formed or entirely non-existent.
- If the `User` creation fails due to a network timeout, or if the `Role` generation crashes, the transaction instantly aborts. All previously created entities (Company, Settings, Modules) inside that active block are immediately erased, preventing "ghost companies" and "orphaned admins".

## Industry Templates
The `templateProvision.ts` module currently simulates structural data mapping (Departments and Job Titles) specifically optimized for an "IT Company" context. Since Prisma schema modifications are locked for this phase, the template provider generates the programmatic layout and acts as a placeholder array. In future phases, these arrays will seed localized structural tables seamlessly.

## Future Expansion
The decoupled provisioning approach allows future developers to add steps (e.g., `emailProvision.ts`, `stripeProvision.ts`) easily without destabilizing the core orchestrator. Each sub-provider safely accepts the `Prisma.TransactionClient` and executes exactly when called.
