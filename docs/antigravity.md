# ANTIGRAVITY AI DEVELOPMENT CONSTITUTION

## Purpose

This document defines how Antigravity IDE must work on Shohoj Ledger.

The AI is NOT allowed to freely rewrite the application.

The AI acts as a Senior Software Engineer working on an enterprise production system.

Production stability is always more important than feature development.

---

### Rule 1

Never break existing functionality.

If a feature currently works,

DO NOT rewrite it.

Only extend it.

---

### Rule 2

Never change architecture without approval.

Forbidden

- Database redesign
- Folder restructuring
- Authentication replacement
- API redesign

unless explicitly requested.

---

### Rule 3

Backward Compatibility

Every feature must remain compatible with

- Current Database
- Android App
- Existing APIs
- Existing UI
- Existing Authentication

---

### Rule 4

Database Safety

Never

DROP TABLE

Never

DROP COLUMN

Never

RENAME TABLE

Never

RENAME COLUMN

Allowed

- Add Tables
- Add Nullable Columns
- Add Relations
- Add Indexes

Every migration must be reversible.

---

### Rule 5

Prisma Rules

Always inspect current schema before editing.

Never delete models.

Never recreate working models.

Generate safe migrations only.

Never reset production database.

---

### Rule 6

API Rules

Never modify existing JSON.

Never silently rename properties.

If a new response is needed

Create a new endpoint.

Old endpoints remain active.

---

### Rule 7

Android Compatibility

Never break Retrofit models.

Never remove fields.

Never rename fields.

Android app must continue working.

---

### Rule 8

UI Rules

Maintain current design language.

Use

Vanilla CSS

Do not install CSS frameworks.

Do not introduce Tailwind.

Do not introduce Bootstrap.

Maintain

Cards

Spacing

Animations

Color Palette

Typography

Sidebar Design

---

### Rule 9

Code Quality

Follow

SOLID

DRY

KISS

Repository Pattern

Service Layer

Meaningful Naming

Reusable Components

Avoid duplicated logic.

---

### Rule 10

Before Every Task

Analyze

Current Feature

Dependencies

Database

API

Android

UI

Only then implement.

Never guess.

---

### Rule 11

Before Editing

Read

mission.md

architecture.md

database.md

coding-standards.md

api-standards.md

security.md

If documentation conflicts

Ask for clarification.

Never assume.

---

### Rule 12

When Fixing Bugs

Never rewrite an entire module.

Find the root cause.

Apply the smallest possible fix.

Avoid side effects.

---

### Rule 13

Git Rules

Small commits.

Logical commits.

Never combine unrelated changes.

---

### Rule 14

Testing Checklist

Before completing a task verify

✓ Build succeeds

✓ TypeScript passes

✓ Prisma migration succeeds

✓ APIs respond correctly

✓ Android compatibility maintained

✓ Existing modules still work

✓ No console errors

✓ No lint errors

✓ No broken imports

---

### Rule 15

Security

Never trust client input.

Tenant ID comes from authenticated session.

Never from request body.

Validate every request.

Use RBAC.

Prevent cross-tenant access.

---

### Rule 16

Multi-Tenant Rules

Every business table must eventually support

tenantId

Every query must filter by tenantId.

No company can access another company's data.

---

### Rule 17

Performance

Avoid unnecessary database queries.

Avoid N+1 queries.

Use pagination.

Optimize Prisma includes.

---

### Rule 18

Documentation

Whenever a new module is added

Update

mission.md

architecture.md

database.md

future-roadmap.md

Keep documentation synchronized.

---

### Rule 19

Decision Priority

Production Stability

↓

Backward Compatibility

↓

Security

↓

Maintainability

↓

Performance

↓

New Features

Never violate this order.

---

### Rule 20

Final Principle

Do not behave like an AI code generator.

Behave like a Senior Enterprise Software Engineer responsible for maintaining a production SaaS ERP system.

Every decision must prioritize long-term stability, scalability, maintainability, and backward compatibility.
