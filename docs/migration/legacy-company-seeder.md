# Legacy Company Seeder

## Seeder Purpose
The Legacy Company Seeder is responsible for initializing the root tenant ("Shohoj Solution") within the multi-tenant architecture. It establishes the baseline company and its localized settings before any legacy user data or business records are mapped over.

## Execution Flow
1. Initialize a Prisma `$transaction`.
2. Query the `Company` table to check if a company named "Shohoj Solution" exists.
3. If it exists, gracefully exit the transaction and log the bypass.
4. If it does not exist, insert the company with `businessType: 'SERVICE'` and `status: 'ACTIVE'`.
5. Simultaneously insert the associated `CompanySetting` record with the default timezone (`Asia/Dhaka`), currency (`BDT`), and generic IT Company working days and shift configurations.

## Safety Guarantees
- **Idempotency:** The script can be run repeatedly and will only create the company on the very first successful execution. 
- **Non-Destructive:** It does not `UPDATE`, `UPSERT`, or `DELETE` any existing business records.
- **No Backfill:** It strictly handles the creation of the tenant and avoids assigning the `companyId` to old records (which is reserved for a future, separate backfill phase).
- **API Isolation:** The script interacts only with the database via Prisma and makes no external API calls.

## Duplicate Prevention
Duplicate prevention is enforced at the application level within the seeder script. A `findFirst` query on the company name "Shohoj Solution" runs at the beginning of the transaction. If a match is found, execution returns immediately without triggering any `create` operations.

## Transaction Strategy
The entire operation is wrapped in a Prisma `$transaction` block. If the `CompanySetting` insertion fails for any reason (e.g., schema misalignment), the parent `Company` creation is automatically rolled back, preventing orphaned tenant records.

## Rollback Notes
If the seeder fails mid-execution, no database changes persist because of the atomic transaction block. If a manual rollback is required post-execution, a simple database command (`DELETE FROM "Company" WHERE name = 'Shohoj Solution'`) safely reverses the operation. Since no legacy records have been backfilled with this ID yet, deleting the company has zero impact on legacy single-tenant data.
