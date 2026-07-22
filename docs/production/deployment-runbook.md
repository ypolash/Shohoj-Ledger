# Deployment Runbook

## Continuous Integration / Continuous Deployment (CI/CD)

Shohoj Ledger utilizes automated deployments via **Coolify**, hooked directly into the GitHub repository.

### Standard Release Process (Rolling Deployment)
1. **Merge to Main:** Once a PR passes CI (linting, tests), it is merged into the `main` branch.
2. **Coolify Webhook:** GitHub fires a webhook to the Coolify control plane.
3. **Build Phase:** 
   - Coolify clones the repository.
   - Runs `npm install`.
   - Generates Prisma client: `npx prisma generate`.
   - Runs Next.js build: `npm run build` (creating the standalone bundle).
4. **Deploy Phase:** 
   - Coolify spins up the new Docker container.
   - Coolify executes the Health Check (`/api/health`) against the new container.
   - If `status: 200 UP` is received, the Load Balancer switches traffic from the old container to the new one.
   - The old container is safely killed.

### Database Migration Strategy
- **NEVER** run `prisma migrate deploy` automatically within the Dockerfile `CMD` block, as it can cause race conditions during rolling deployments with multiple containers.
- **Protocol:** Migrations are executed as a separate pre-deploy CI step, or run manually via `npx prisma migrate deploy` in an isolated Coolify Job before triggering the web application build.

### Rollback Procedure
If the `/api/health` check fails or monitoring spikes after a deployment:
1. Navigate to the Coolify Dashboard -> Projects -> Shohoj Ledger.
2. Click the **Deployments** tab.
3. Find the previous successful deployment and click **Rollback**.
4. The load balancer will instantly revert traffic back to the stable image.
