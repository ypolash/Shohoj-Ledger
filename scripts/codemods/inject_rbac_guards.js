const fs = require('fs');
const path = require('path');

const rbacMap = [
  { folder: 'payroll', prefix: 'PAYROLL' },
  { folder: 'attendance', prefix: 'ATTENDANCE' },
  { folder: 'mobile/attendance', prefix: 'ATTENDANCE' },
  { folder: 'projects', prefix: 'PROJECT' },
  { folder: 'leads', prefix: 'LEAD' },
  { folder: 'income', prefix: 'FINANCE' },
  { folder: 'expenses', prefix: 'FINANCE' },
  { folder: 'funds', prefix: 'FINANCE' },
  { folder: 'advances', prefix: 'FINANCE' },
  { folder: 'loans', prefix: 'FINANCE' },
  { folder: 'reserves', prefix: 'FINANCE' },
  { folder: 'settlements', prefix: 'FINANCE' },
  { folder: 'leaves', prefix: 'ATTENDANCE' },
  { folder: 'employees', prefix: 'EMPLOYEE' },
  { folder: 'staff', prefix: 'EMPLOYEE' },
];

const basePath = path.join(__dirname, 'app', 'api');

function processDir(dirPath) {
  let modifiedFiles = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      modifiedFiles.push(...processDir(fullPath));
    } else if (item === 'route.ts') {
      const relPath = path.relative(basePath, dirPath);

      let matchedPrefix = null;
      for (const mapping of rbacMap) {
        if (relPath === mapping.folder || relPath.startsWith(mapping.folder + path.sep)) {
          matchedPrefix = mapping.prefix;
          break;
        }
      }

      if (matchedPrefix) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Insert import if not exists
        if (!content.includes('requirePermission')) {
          const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g;
          let lastImportIndex = 0;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            lastImportIndex = match.index + match[0].length;
          }

          let importsToAdd = `\nimport { requirePermission } from "@/lib/rbac/permissionGuard";`;
          content = content.slice(0, lastImportIndex) + importsToAdd + '\n' + content.slice(lastImportIndex);
        }

        const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
        let changed = false;

        for (const method of methods) {
          const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{`, 'g');
          let match;
          
          let newContent = content;
          while ((match = methodRegex.exec(content)) !== null) {
            const blockStart = match.index + match[0].length;
            
            // Check if guard already exists
            const snippet = content.slice(blockStart, blockStart + 300);
            if (!snippet.includes('requirePermission(')) {
              const suffix = method === 'GET' ? 'VIEW' : 'MANAGE';
              const requiredAction = `${matchedPrefix}_${suffix}`;

              const guardInjection = `
  const rbacGuard = await requirePermission("${requiredAction}");
  if (rbacGuard) return rbacGuard;
`;
              newContent = newContent.slice(0, blockStart) + guardInjection + newContent.slice(blockStart);
              changed = true;
            }
          }
          content = newContent;
        }

        if (changed) {
          fs.writeFileSync(fullPath, content);
          modifiedFiles.push(fullPath);
        }
      }
    }
  }
  return modifiedFiles;
}

const updated = processDir(basePath);
console.log(`Updated ${updated.length} files with RBAC guards.`);
