<!-- markdownlint-disable MD025 -->
# AI Rules

This document defines the behavior of every AI coding agent working on Shohoj Ledger.

These rules are mandatory.

---

# Mission

Your job is NOT to redesign Shohoj Ledger.

Your responsibility is to safely extend the existing Enterprise SaaS ERP platform.

Production stability always has higher priority than feature delivery.

---

# Documentation First

Before writing ANY code

Read

docs/README.md

Then follow the documentation order.

Never skip documentation.

---

# Project Understanding

Understand

- Business Rules
- Architecture
- Database
- APIs
- Authentication
- Authorization
- Multi-Tenant
- Android Compatibility

before making changes.

Never guess.

---

# Analyze Before Coding

Inspect

- Folder Structure
- Components
- Services
- Repositories
- Prisma Models
- Existing APIs
- Existing UI

Reuse existing code.

Avoid duplicate logic.

---

# Approval Workflow

Before implementation explain

- What you understood
- Files to modify
- Why
- Risks
- Database impact
- API impact
- Android impact
- Multi-Tenant impact

Wait for approval.

---

# Scope Protection

The requested task defines the implementation boundary.

Never expand the task automatically.

Never perform

- Opportunistic refactoring
- Opportunistic security fixes
- Opportunistic database changes
- Opportunistic API redesign
- Opportunistic architecture redesign
- Opportunistic UI redesign
- Unrequested performance optimization

If additional issues are discovered

STOP.

Create an Architecture Review Report.

Include

- Issue
- Severity
- Impact
- Recommendation

Wait for approval.

Only implement the approved scope.

Never modify unrelated files.

Never modify unrelated modules.

Never modify unrelated APIs.

Never modify unrelated database objects.

Always keep changes isolated.

---

# Architecture Rules

Never redesign architecture.

Never rewrite stable modules.

Always extend.

Reuse existing services.

Reuse existing utilities.

Reuse existing components.

---

# Database Rules

Never

- Drop tables
- Drop columns
- Rename tables
- Rename columns
- Perform destructive migrations

Allowed

- New tables
- Nullable columns
- New indexes
- Relations

Always keep migrations backward compatible.

---

# API Rules

Never break Android compatibility.

Never rename endpoints.

Never remove response fields.

Prefer versioning.

Keep response format consistent.

---

# Multi-Tenant Rules

Every business record belongs to one tenant.

Every query must filter by tenantId.

Never expose another tenant's data.

Never bypass tenant isolation.

Every new feature must support Multi-Tenant.

---

# UI Rules

Use Vanilla CSS.

Reuse components.

Maintain design consistency.

Do not introduce

- Bootstrap
- Tailwind
- Material UI

unless explicitly requested.

---

# Security Rules

Validate authentication.

Validate authorization.

Validate tenant ownership.

Sanitize input.

Never expose secrets.

Never trust client-side data.

---

# Testing Checklist

Before completion verify

- Project builds successfully
- TypeScript passes
- Prisma validates
- Existing APIs still work
- Existing features still work
- Android compatibility remains
- Multi-Tenant isolation remains

---

# Completion Report

Always provide

- Files changed
- Database changes
- API changes
- UI changes
- Breaking changes
- Testing summary

If there are no breaking changes explicitly state

"No breaking changes introduced."

---

# Enterprise Rule

Large Enterprise software always contains technical debt.

Do NOT fix unrelated problems.

Report them.

Wait for approval.

Only implement the approved task.

Protect

- Production
- Existing Users
- Existing Data
- Existing Architecture
- Existing Business Logic

Never sacrifice long-term architecture for short-term convenience.
