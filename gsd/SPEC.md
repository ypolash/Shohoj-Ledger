# Company Finance & Revenue Sharing CRM

## Core Features
- Income management
- Expense management
- Add fund system
- Reserve balance system
- Member loan system
- Due balance / advance system
- Monthly settlement
- Project profitability tracking
- Cash flow monitoring
- Dashboard & reports

## Income Distribution
- Marketing: CEO 50%, Company 50%
- Consulting: CEO 50%, Company 50%
- Development: CEO 40%, Developer 20%, Company 40%
- Maintenance: CEO 40%, Developer 20%, Company 40%
- Support/Training: CEO 50%, Company 50%

## Important Rules
- Only PAID income is included in settlement
- PARTIAL income counts only received amount
- Share is calculated after approved expenses
- Company share goes to Reserve Balance
- Add Fund is not shareable
- Owner Contribution is tracked separately

## Loan Policy
- Interest free
- Manual repayment entry
- Validity: 6 months
- Status becomes OVERDUE after 6 months
- Future reserve loans can be restricted if overdue

## Due Balance System
- Advance payments create due balance
- Future shares are reduced by due balance
- Remaining due carries forward until cleared

## Tech Stack
- Next.js 15
- Vanilla CSS (CSS Modules)
- PostgreSQL 16
- Prisma ORM
- Better Auth
- Docker Compose
- Coolify
- MinIO

## Backup Policy
- Daily PostgreSQL backup
- Weekly MinIO file backup
- 30 days retention
