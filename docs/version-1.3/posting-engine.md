# Automatic Posting Engine (Phase 1H-B)

## Architecture Overview
The Automatic Posting Engine acts as the strict, programmatic gateway between operational modules (Sales, HR) and the General Ledger. It completely abstracts double-entry accounting complexity away from upstream systems. Instead of inserting `JournalEntry` rows directly, a module builds a `PostingRequest` payload and hands it to `AccountingPostingService.post()`.

## Posting Lifecycle Flow
1. **Business Module**: E.g., Sales module approves an invoice and constructs a `PostingRequest` (Debits to AR, Credits to Revenue).
2. **Posting Validation**: `validatePosting()` ensures debits/credits match, accounts are active, and the period is open.
3. **Voucher Number**: `generateVoucherNumber()` creates a globally unique tracking ID.
4. **Transaction Start**: A Prisma `$transaction` begins.
5. **Journal Entry**: Creates the `DRAFT` header.
6. **Journal Lines**: Attaches the validated lines.
7. **Ledger Entries**: Explodes the lines into immutable `LedgerEntry` facts.
8. **Complete**: Updates the Journal status to `POSTED`. If any step fails, the entire transaction drops (ACID compliance).

## Idempotency & Duplicate Protection
The engine structurally prevents duplicate postings via two layers of defense:
1. `validatePosting()` checks if a `JournalEntry` already exists with the same `referenceType` and `referenceId`. Throws `DuplicatePostingException` if found.
2. The Database Schema enforces `@@unique([companyId, entryNumber])`.

## Reversal Strategy
To maintain absolute compliance, entries cannot be deleted. Calling `reverse()` performs the following:
1. Queries the original `POSTED` journal and its lines.
2. Builds an inverted `PostingRequest` where original Debits become Credits, and Credits become Debits.
3. Posts the new inverted Journal.
4. Marks the original Journal as `VOID`.
This preserves the full audit trail of the mistake and the correction in the Ledger.

## Security Model
- **Tenant Isolation**: Every validation query and creation payload explicitly passes `{ companyId }` to prevent cross-contamination.
- **RBAC**: Protected by `POSTING_EXECUTE`, `POSTING_REVERSE`, and `POSTING_AUDIT` permissions.
- **Period Locks**: The engine explicitly checks `AccountingPeriod.isClosed`. If a financial controller locks Q3, no module can retroactively post an expense into September.

## Scalability
The engine leverages Prisma `createMany` and batch `$transaction` capabilities to minimize network round-trips to PostgreSQL, ensuring that a complex payroll run with 5,000 employees posts in mere milliseconds.
