# Backfill Engine Documentation

## Engine Architecture
The Backfill Engine is a robust, reusable utility suite located at `prisma/seeders/utils/backfillEngine.ts`. It provides helper functions intended strictly for subsequent database population or migration scripts. It decouples the core logic of iterating over data from the safety concerns of database management (transactions, error handling, retries, and logging).

## Batch Strategy
The engine accepts a dynamic, non-hardcoded `batchSize` configuration via the `BackfillContext`.
- Instead of attempting to update 10,000 rows in one massive query that locks the table, the `processInBatches` utility slices the data into configurable chunks (e.g., 100, 250, 500).
- Each batch is resolved asynchronously using `Promise.all()` to parallelize network I/O to the database safely.

## Transaction Strategy
All database mutations inside a batch are wrapped utilizing the `executeInTransaction` helper.
- This creates an interactive Prisma `$transaction`.
- The configuration increases the default `maxWait` and `timeout` values (to 15s and 60s, respectively) to accommodate slightly heavier sequential update operations, preventing lock timeout crashes.
- If *any* update fails within a batch, the entire batch rolls back automatically.

## Dry Run Mode
Dry run support is built deeply into the engine through the `dryRunSupport` and `safeUpdate` functions, as well as the context `dryRun: boolean` variable.
- When `dryRun` is enabled, `executeInTransaction` passes a raw Prisma client instead of a transaction client and avoids DB-locking.
- `safeUpdate` skips calling `model.update()` entirely. Instead, it stringifies the JSON payload and outputs precisely what *would* have been executed to the console.

## Error Handling
The system mandates **no silent failures**.
- Errors caught inside a batch are aggregated in the `BatchProcessingResult.failedRecords` array for tracing.
- If a batch fails persistently, the engine throws a hard exception, halting execution of the script so operators can intervene without having half of the data processed and the other half missing.

## Retry Strategy
The `withRetry` utility provides exponential backoff for transient database issues (e.g., brief deadlocks or network hiccups).
- By default, it intercepts transaction failures, waits (e.g., 500ms, then 1000ms, then 2000ms), and attempts the same batch again.
- If it fails beyond the specified limit (default 3), the error is escalated to abort the sequence.

## Extension Guidelines
When creating future scripts:
1. Always import and rely on `BackfillContext`.
2. Do not write raw `prisma.model.update` loops. Use `processInBatches`.
3. Rely on `validationHelpers` before updating objects.
