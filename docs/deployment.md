# Deployment

## Infrastructure

- **Deployment Platform:** Coolify
- **Containerization:** Docker

## Database

- **Database:** PostgreSQL
- **ORM:** Prisma

## Prisma Migration Rules

- Never drop tables.
- Never rename tables.
- Never delete columns.
- Only add tables, nullable columns, indexes, and relations.
- Migrations must always be backward compatible.
- Destructive migrations are strictly forbidden.

## Environment Variables

- Ensure all required environment variables are set in Coolify before deploying.
- Keep secrets secure; never hardcode API keys or secrets in the codebase.

## Backup Policy

- Database backups must be configured securely.
- Ensure automated backups are enabled to prevent data loss.

## Production Deployment Rules

- Production stability is the highest priority.
- Always verify backward compatibility of API and Database changes before merging.
- Android and Web must continue to work without disruption after every deployment.
