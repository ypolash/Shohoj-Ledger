const fs = require('fs');
const path = require('path');

const moduleMap = [
  { folder: 'payroll', module: 'PAYROLL' },
  { folder: 'attendance', module: 'ATTENDANCE' },
  { folder: 'mobile/attendance', module: 'ATTENDANCE' },
  { folder: 'projects', module: 'PROJECTS' },
  { folder: 'leads', module: 'LEAD_MANAGEMENT' },
  { folder: 'income', module: 'ACCOUNTING' },
  { folder: 'expenses', module: 'ACCOUNTING' },
  { folder: 'funds', module: 'ACCOUNTING' },
  { folder: 'advances', module: 'ACCOUNTING' },
  { folder: 'loans', module: 'ACCOUNTING' },
  { folder: 'reserves', module: 'ACCOUNTING' },
  { folder: 'settlements', module: 'ACCOUNTING' },
  { folder: 'leaves', module: 'ATTENDANCE' },
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
      const relPath = path.relative(basePath, dirPath); // e.g., 'payroll', 'attendance/networks'

      let matchedModule = null;
      for (const mapping of moduleMap) {
        // If the path starts with the folder mapping (e.g., 'payroll', 'mobile/attendance')
        if (relPath === mapping.folder || relPath.startsWith(mapping.folder + path.sep)) {
          matchedModule = mapping.module;
          break;
        }
      }

      if (matchedModule) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Check if getCompanyId and requireModule are already imported
        if (!content.includes('requireModule')) {
          // Find import section
          const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g;
          let lastImportIndex = 0;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            lastImportIndex = match.index + match[0].length;
          }

          let importsToAdd = `\nimport { requireModule } from "@/lib/modules/moduleGuard";`;
          
          if (!content.includes('getCompanyId')) {
            importsToAdd += `\nimport { getCompanyId } from "@/lib/company/companyFilter";`;
          }

          content = content.slice(0, lastImportIndex) + importsToAdd + '\n' + content.slice(lastImportIndex);
        }

        const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
        let changed = false;

        for (const method of methods) {
          const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{`, 'g');
          let match;
          
          // Rebuild content to handle multiple methods
          let newContent = content;
          while ((match = methodRegex.exec(content)) !== null) {
            const blockStart = match.index + match[0].length;
            
            // Check if guard already exists in this block (simplified check within first 300 chars)
            const snippet = content.slice(blockStart, blockStart + 300);
            if (!snippet.includes('requireModule(')) {
              const guardInjection = `
  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "${matchedModule}");
  if (moduleGuard) return moduleGuard;
`;
              newContent = newContent.slice(0, blockStart) + guardInjection + newContent.slice(blockStart);
              changed = true;
              
              // We need to re-sync indices since we mutated the string, so we just break and let the next pass (if any) handle it, or restart.
              // Actually, since we want to be safe, doing a simple replacement is fine.
              // But replacing while iterating via exec can drift indices. Let's just do a string replacement.
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
console.log(`Updated ${updated.length} files with module guards.`);
