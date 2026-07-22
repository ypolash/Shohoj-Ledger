# Architecture Status: FROZEN

## Declaration

As of Version 1.0.0, the backend enterprise architecture of Shohoj Ledger is declared **FROZEN**.

## Implications

- **No Fundamental Redesigns:** The core multi-tenant injection methodology (`withCompany()`), RBAC middleware (`requirePermission()`), and Module blocking (`requireModule()`) are locked. No major refactors of these patterns are permitted without a major version bump (V2.0.0).
- **Additive Only:** Future features must build *on top* of this foundation, not modify it. If a new business module is created, it must blindly adhere to the existing security paradigms.
- **Strict Backward Compatibility:** Any future Prisma migrations must not break existing mobile or frontend integrations.

## Exception Policy

The architecture may only be thawed under the following conditions:

1. A SEV-1 security vulnerability is discovered that mathematically requires an architectural paradigm shift (e.g., transitioning from Row-Level Security to distinct physical databases).
2. A fundamental underlying dependency (e.g., Next.js App Router, Prisma ORM) deprecates a core feature requiring immediate migration.
