<!-- markdownlint-disable MD025 -->
# ARCHITECTURE DECISION RECORDS (ADR)

This document records important architectural decisions made during the development of Shohoj Ledger.

Every major technical or business decision must be documented here before implementation.

---

# ADR-001

## Project Architecture

Decision

Shohoj Ledger will be developed as a Modular Multi-Tenant SaaS ERP/CRM platform.

Reason

- Unlimited companies
- Single codebase
- Easy maintenance
- Future SaaS business

Status

Approved

---

# ADR-002

## Multi Tenant Strategy

Decision

Use Shared Database + tenantId.

NOT Separate Database per Company.

Reason

- Lower infrastructure cost
- Easier deployment
- Easier maintenance
- Better scalability
- Easier reporting

Status

Approved

---

# ADR-003

## Authentication

Decision

Use jose + bcryptjs JWT authentication.

Reason

- Full control
- Separate Admin and Employee login
- Better Android compatibility
- Easier Multi-Tenant support

Status

Approved

---

# ADR-004

## Frontend

Decision

Use Vanilla CSS.

Do not migrate to Tailwind.

Reason

- Existing project uses Vanilla CSS
- Easier maintenance
- No unnecessary rewrite

Status

Approved

---

# ADR-005

## Backend

Decision

Continue using Next.js API Routes.

Reason

- Existing architecture
- Easier deployment
- Shared codebase

Status

Approved

---

# ADR-006

## Database

Decision

Continue PostgreSQL + Prisma.

Reason

- Mature ecosystem
- Safe migrations
- Type safety

Status

Approved

---

# ADR-007

## Android

Decision

Android application will consume the same APIs as the web application.

Reason

- Single backend
- Less maintenance
- Faster development

Status

Approved

---

# ADR-008

## Migration Strategy

Decision

Never rewrite working modules.

Only extend.

Reason

Production stability is more important than new features.

Status

Approved

---

# ADR-009

## Business Types

Decision

Business Type is only a starter template.

Available

- Product
- Service
- Product + Service

Reason

Companies may enable any module later.

Status

Approved

---

# ADR-010

## Module System

Decision

Every module can be enabled or disabled.

Examples

- CRM
- Inventory
- Attendance
- Payroll
- Accounting
- Projects

Reason

Maximum flexibility.

Status

Approved

---

# ADR-011

## Industry Templates

Decision

Initially support

IT Company

Future

- Hospital
- School
- Manufacturing
- Restaurant
- Retail
- NGO
- Real Estate

Reason

Faster onboarding.

Status

Approved

---

# ADR-012

## Existing Shohoj Solution

Decision

Current Shohoj Solution becomes the Default Tenant.

Reason

Avoid data migration complexity.

Status

Approved

---

# ADR-013

## API Compatibility

Decision

Never break old API responses.

If changes are needed

Create new endpoints.

Reason

Android compatibility.

Status

Approved

---

# ADR-014

## Database Migration

Decision

Never

- Drop tables
- Rename tables
- Delete columns

Only

- Add tables
- Add nullable columns
- Add indexes
- Add relations

Reason

Safe production migration.

Status

Approved

---

# ADR-015

## UI Philosophy

Decision

Preserve current UI.

Improve consistency only.

Reason

Avoid unnecessary redesign.

Status

Approved

---

# ADR-016

## Deployment

Decision

Deploy using Docker + Coolify.

Reason

Existing production infrastructure.

Status

Approved

---

# ADR-017

## Development Priority

Priority Order

1. Production Stability
2. Backward Compatibility
3. Security
4. Scalability
5. Maintainability
6. Performance
7. New Features

Status

Approved

---

# ADR-018

## Documentation

Decision

Every significant architectural change must update:

- mission.md
- architecture.md
- project-context.md
- decisions.md
- future-roadmap.md

Reason

Documentation must always match the implementation.

Status

Approved
