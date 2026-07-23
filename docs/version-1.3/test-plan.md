# Automated Test Plan (Phase 1K)

## 1. Overview
Before deploying Phase 1 into the production `main` branch, the following automated test scenarios must be implemented via Jest/Vitest to guarantee absolute financial integrity under high-concurrency conditions.

## 2. Core Posting Engine Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TE-01 | Submit balanced `PostingRequest` to `post()` | Transaction succeeds. Status = `POSTED`. |
| TE-02 | Submit unbalanced `PostingRequest` (Debits != Credits) | Throws `ValidationException`. |
| TE-03 | Submit to closed `AccountingPeriod` | Throws `ClosedPeriodException`. |
| TE-04 | Submit with inactive `ChartOfAccount` | Throws `InactiveAccountException`. |
| TE-05 | Re-submit exact same `PostingRequest` (Duplicate) | Throws `DuplicatePostingException`. |
| TE-06 | Call `reverse()` on a posted journal | New inversion journal posted. Original marked `VOID`. |

## 3. Financial Statements Integrity Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| FS-01 | Generate Trial Balance on empty ledger | Debits: 0, Credits: 0, Diff: 0 |
| FS-02 | Generate Trial Balance after 5 random postings | Total Debits == Total Credits |
| FS-03 | P&L Generation after 1 Revenue & 1 Expense post | Net Income = Revenue - Expense |
| FS-04 | Balance Sheet Equation check | `Total Assets == Total Liabilities + Total Equity` |

## 4. Integration Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| IT-01 | Trigger `postPurchase()` in Inventory | Ledger correctly maps Asset Debit and AP Credit. |
| IT-02 | Trigger `postSale()` in Inventory | Perpetual 4-leg entry posts successfully. |
| IT-03 | Trigger `postPayroll()` in Payroll | Payroll Accrual entry posts successfully. |

## 5. Security & Isolation Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| SEC-01 | Post journal for Company A | Querying Trial Balance for Company B returns 0. |
| SEC-02 | Attempt API access without `POSTING_EXECUTE` | 403 Forbidden. |
| SEC-03 | High-Concurrency Stress Test | Fire 100 simultaneous postings; zero duplicates created. |
