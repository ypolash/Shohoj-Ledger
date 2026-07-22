# Database Rules

Never

- Drop Tables
- Rename Tables
- Delete Columns

Always

- Add nullable columns
- Add indexes
- Add relations

Every business table must support tenantId.

Migration must always be backward compatible.
