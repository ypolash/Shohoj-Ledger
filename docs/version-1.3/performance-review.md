# Performance Review (Phase 1K)

## 1. Query Efficiency & N+1 Risks
The engine was explicitly designed to mitigate ORM N+1 inefficiencies.
- **Batch Insertion**: `createJournalLines` and `createLedgerEntries` utilize Prisma's `createMany` API, compiling dozens of queries into a single parameterized bulk `INSERT`.
- **Aggregation Acceleration**: Rather than fetching millions of ledger rows into the Node runtime, the reporting engines rely exclusively on `prisma.ledgerEntry.groupBy()`. This pushes the heavy arithmetic down to PostgreSQL, returning only lightweight, aggregated DTOs over the network.

## 2. Prisma Indexing Strategy
To maintain O(1) performance as the `LedgerEntry` table grows to millions of rows, the following composite indexes must be verified in the Prisma schema:
- `@@index([companyId, accountId])`: Essential for fast Trial Balance and Balance Sheet generation.
- `@@index([companyId, entryDate])`: Critical for filtering the Cash Flow statement by fiscal periods.
- `@@unique([companyId, entryNumber])`: Required for voucher idempotency.

## 3. Large Ledger Scalability
- **Pagination**: Any UI viewing the `LedgerEntry` table must enforce strict server-side cursor pagination.
- **Partitioning Preparedness**: Because every `LedgerEntry` features `entryDate` and `companyId`, the database is structurally prepared for PostgreSQL Table Partitioning (by year or by tenant) when the database size exceeds 100GB.

## 4. Risks Found
- **Memory Thresholds**: The `balanceSheetService.ts` currently fetches *all* Chart of Account records for a company into memory before mapping the grouped ledger entries. If a company has 10,000 specific accounts, this could cause GC spikes.
- **Recommendation**: Refactor the reporting engines to perform a pure SQL `JOIN` mapping via raw queries if the Chart of Accounts size exceeds practical Prisma bounds.
