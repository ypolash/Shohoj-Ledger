# Graph Report - /home/polash/Shohoj/Shohoj Ledger  (2026-07-15)

## Corpus Check
- Corpus is ~14,933 words - fits in a single context window. You may not need a graph.

## Summary
- 190 nodes · 172 edges · 28 communities (9 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Routes & Prisma
- NPM Package Config
- TypeScript Compiler Options
- Dev Dependencies
- Frontend Dependencies
- Next.js TS Config
- Settlements & Calculations
- Authentication
- Advances Page
- Income Page
- Loans Page
- Root Layout
- Expenses Page
- Funds Page
- Members Page
- Dashboard Page
- Projects Page
- Reserves Page
- Settlement Page
- Test Script
- Auth Client
- Next Config
- Backup Script
- Test Prisma

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `include` - 6 edges
3. `scripts` - 5 edges
4. `lib` - 4 edges
5. `calculateSettlement()` - 3 edges
6. `repository` - 3 edges
7. `react` - 3 edges
8. `GET()` - 2 edges
9. `MemberProfilePage()` - 2 edges
10. `auth` - 2 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `calculateSettlement()`  [EXTRACTED]
  app/api/settlements/route.ts → lib/calculations.ts
- `MemberProfilePage()` --references--> `react`  [EXTRACTED]
  app/dashboard/members/[id]/page.tsx → package.json

## Import Cycles
- None detected.

## Communities (28 total, 19 thin omitted)

### Community 1 - "NPM Package Config"
Cohesion: 0.10
Nodes (20): author, bugs, url, description, directories, lib, homepage, keywords (+12 more)

### Community 2 - "TypeScript Compiler Options"
Cohesion: 0.10
Nodes (21): ./*, dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental (+13 more)

### Community 3 - "Dev Dependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, @prisma/client, @types/node (+9 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.12
Nodes (15): Member, MemberProfilePage(), better-auth, chart.js, next, dependencies, better-auth, chart.js (+7 more)

### Community 5 - "Next.js TS Config"
Cohesion: 0.22
Nodes (8): .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude, include

## Knowledge Gaps
- **76 isolated node(s):** `{ GET, POST }`, `Advance`, `User`, `Expense`, `FundTransaction` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `NPM Package Config`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Dependencies` to `NPM Package Config`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TypeScript Compiler Options` to `Next.js TS Config`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `{ GET, POST }`, `Advance`, `User` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes & Prisma` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `NPM Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._