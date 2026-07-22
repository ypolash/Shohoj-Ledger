# Coolify Deployment Guide - Version 1.2

## Pre-Deployment Checklist
- [ ] SSH access to the Coolify instance verified.
- [ ] Database backup confirmed and available locally.
- [ ] Coolify Resource limits (CPU/RAM) checked to handle the Next.js `npm run build` process (Requires at least 2GB RAM to prevent Webpack OOM errors).
- [ ] Webhook from Git repository is active.

## Environment Variables
Ensure the following variables are strictly set and valid in the Coolify Environment configuration:
- `DATABASE_URL` (Points to production PostgreSQL)
- `NEXT_PUBLIC_API_URL`
- `JWT_SECRET` or `NEXTAUTH_SECRET`
- Ensure NO development or test variables are leaked into the production tab.

## Build Verification
1. Trigger the deployment manually via the Coolify Dashboard.
2. Monitor the Build Logs. Pay strict attention to:
   - `prisma generate` succeeding.
   - `next build` succeeding without TypeScript strict-mode compilation errors.
3. If the build fails, Coolify will automatically keep the old v1.1 container running (Zero-downtime deployment safety).

## Health Checks
Once Coolify reports "Healthy" and routes traffic to the new container:
1. Ping the primary API health endpoint.
2. Verify the Login page loads successfully.
3. Check the Coolify Traefik/Caddy proxy logs for 502 Bad Gateway errors indicating a container crash loop.

## Rollback Procedure
If the application crashes post-deployment:
1. In the Coolify UI, navigate to the Application -> Deployments history.
2. Find the previous successful deployment (v1.1 commit hash).
3. Click **"Rollback"** or **"Redeploy"** on that specific build.
4. If a database rollback was also required, ensure the DB is restored *before* spinning up the old container.
