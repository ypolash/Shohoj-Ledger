# Go-Live Verification Checklist (V1.0.0)

## Final Pre-Flight

- [x] Run `npm run lint` and verify zero errors.
- [x] Run `npm run build` and ensure Next.js compiles the Standalone bundle without typing failures.
- [x] Verify `.env.production` includes correct production DB URL and heavily rotated JWT secrets.
- [x] Clear existing testing data from the Production Database if applicable.

## Coolify Operations

- [x] Force a manual Postgres Backup via the Coolify dashboard.
- [x] Deploy the `main` branch to the production container.
- [x] Watch the deployment logs for successful `npx prisma generate` execution.
- [x] Await the successful Load Balancer switch (Health check passed).

## Post-Flight (Live Testing)

- [x] Create a live test company via the signup page.
- [x] Verify email delivery (if configured).
- [x] Log in as the new Company Owner.
- [x] Attempt to access disabled modules and verify the 403 response.
- [x] Attempt to create a standard User and assign them an HR role.
- [x] Verify HR user cannot access Finance endpoints.

## Sign-off

- [ ] DevOps Lead: ___________________
- [ ] QA Lead: ___________________
- [ ] Architecture Lead: ___________________
