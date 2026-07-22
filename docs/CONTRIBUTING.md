<!-- markdownlint-disable MD025 -->
# CONTRIBUTING.md

# Shohoj Ledger Contribution Guide

Welcome to Shohoj Ledger.

This is an Enterprise SaaS Multi-Tenant ERP & CRM Platform.

Every contributor (human or AI) must follow this guide.

---

# Before You Start

Before writing any code you MUST read

docs/README.md

Then follow the documentation order.

Never skip documentation.

---

# Development Workflow

Every task must follow this sequence.

## Step 1

Read documentation.

## Step 2

Analyze existing implementation.

## Step 3

Compare documentation with implementation.

## Step 4

Report inconsistencies.

## Step 5

Explain implementation plan.

## Step 6

Wait for approval.

## Step 7

Implement only approved scope.

## Step 8

Verify everything.

## Step 9

Summarize changes.

---

# Branch Strategy

Never work directly on production.

Recommended branches

feature/...

bugfix/...

hotfix/...

refactor/...

docs/...

---

# Commit Convention

Use clear commit messages.

Examples

feat(payroll): add overtime calculation

fix(attendance): resolve late calculation bug

docs(modules): update settlement rules

refactor(api): simplify employee service

style(ui): improve dashboard spacing

---

# Pull Request Rules

Every PR should include

Purpose

Files Changed

Database Changes

API Changes

UI Changes

Breaking Changes

Testing Summary

---

# Code Style

Write clean readable code.

Reuse existing services.

Reuse components.

Avoid duplicate logic.

Prefer composition.

Keep functions small.

Use meaningful variable names.

---

# Database Rules

Never

Drop tables

Drop columns

Rename tables

Rename columns

Perform destructive migrations

Allowed

Add tables

Add nullable columns

Add indexes

Add relations

Every migration must be backward compatible.

---

# API Rules

Android and Web use the same APIs.

Never break API responses.

Never remove response fields.

Prefer versioning.

Keep response format consistent.

---

# Multi-Tenant Rules

Every business record belongs to exactly one tenant.

Every Prisma query must include tenantId.

Never expose another company's data.

Never bypass tenant isolation.

---

# UI Rules

Vanilla CSS only.

Reuse existing styles.

Maintain responsive layouts.

Keep consistent spacing.

Keep smooth animations.

Do not introduce Bootstrap, Tailwind or other UI frameworks unless explicitly requested.

---

# Security Rules

Validate authentication.

Validate authorization.

Validate tenant ownership.

Sanitize inputs.

Never trust client-side data.

Never expose secrets.

---

# Testing Checklist

Before finishing verify

Project builds successfully.

No TypeScript errors.

No Prisma errors.

No lint errors.

Existing APIs still work.

Android compatibility maintained.

Multi-Tenant isolation maintained.

No existing feature broken.

---

# Documentation Rules

If business logic changes

Update documentation.

If database changes

Update database.md.

If API changes

Update api-standards.md.

If architecture changes

Update architecture.md.

If module changes

Update modules.md.

Documentation must always match implementation.

---

# AI Agent Rules

If you are an AI coding agent

Read docs/README.md first.

Never guess.

Never redesign architecture.

Never rewrite stable code.

Never modify unrelated files.

Never continue when documentation conflicts with implementation.

Always ask for approval before major changes.

---

# Project Goal

Shohoj Ledger is being built as a world-class Enterprise SaaS ERP platform.

Every contribution should improve

Scalability

Maintainability

Security

Performance

Developer Experience

Production Stability

Never sacrifice long-term architecture for short-term convenience.
