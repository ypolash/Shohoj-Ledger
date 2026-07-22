# Legacy Data Backfill Execution

## Purpose
The Legacy Data Backfill script (`backfillLegacyCompany.ts`) is designed to migrate single-tenant legacy data into the new multi-tenant architecture. It explicitly assigns the default root tenant ("Shohoj Solution") to all business records currently isolated due to `companyId = NULL`.

## Execution Steps
1. The script initializes and fetches the Legacy Company UUID from the database.
2. If the company does not exist, the script fails safely. It relies on the preceding execution of the Legacy Company Seeder.
3. The script loops over a strictly defined list of approved business models. Auth tables (`Session`, `Account`, `Verification`) are completely ignored.
4. It executes a targeted query to find records explicitly possessing `companyId: null`. 
5. It pipes these isolated records through the `BackfillEngine` for batch processing.

## Dry Run
The script fully implements dry run behavior using the `--dry-run` flag (`ts-node backfillLegacyCompany.ts --dry-run`).
- It validates the presence of the root company.
- It calculates exactly how many records need updating.
- It displays intended payload updates in the console.
- **Guarantee:** No actual database mutations occur in this mode.

## Batching
Configured to 500 by default (overridable via `--batch-size 1000`). By slicing the dataset, the script restricts prolonged table locks, ensuring memory consumption remains stable, allowing concurrent operations to proceed unaffected. 

## Recovery
Because the script relies on atomic transactions via the `BackfillEngine`:
- If the script fails in the middle of a batch, only that batch reverts.
- Since the root query enforces `where: { companyId: null }`, the script can be re-run indefinitely. It will simply skip the already successful batches, picking up exactly where it failed without duplication or overwriting constraints.

## Validation
The script utilizes pre- and post-validation. 
- **Pre-flight:** The target `Shohoj Solution` company must strictly exist. 
- **Post-flight:** After updating a model's records, a validation query confirms that `0` records possess `companyId: null`. If any linger, it throws a severe error.

## Failure Handling
Upon catching an error, the batch engine triggers automatic exponential backoff retries. If the failure persists (e.g., severe connection crash), the script intentionally throws a hard exception to kill execution immediately, surfacing the stack trace to the deployment logs for manual intervention.
