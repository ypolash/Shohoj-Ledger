const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'app', 'api');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const models = [
  "advance", "allowedNetwork", "attendance", "attendanceConfig", "bonus",
  "employee", "expense", "fundTransaction", "income", "incomeCategory",
  "lead", "leaveRequest", "member", "memberLoan", "payslip", "project",
  "punishmentSetting", "reserveTransaction", "salaryDeduction", "salaryPayment",
  "settlement", "task"
];

let count = 0;

walkDir(API_DIR, (filePath) => {
  if (!filePath.endsWith('route.ts')) return;
  if (filePath.includes('auth') || filePath.includes('mobile/login') || filePath.includes('users') || filePath.includes('overview')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add imports
  if (!content.includes('withCompany')) {
    content = 'import { withCompany, getCompanyId } from "@/lib/company/companyFilter";\n' + content;
  }
  if (!content.includes('verifyOwnership') && (content.includes('export async function PUT') || content.includes('export async function DELETE'))) {
    content = 'import { verifyOwnership } from "@/lib/company/verifyOwnership";\n' + content;
  }

  // Regex replacement for findMany, findFirst, count without existing where clause
  for (const model of models) {
    const regexEmpty = new RegExp(`prisma\\.${model}\\.(findMany|findFirst|count|aggregate)\\(\\s*\\)`, 'g');
    content = content.replace(regexEmpty, `prisma.${model}.$1({ where: { ...(await withCompany()) } })`);

    // For calls that have an object but no where clause
    const regexObjNoWhere = new RegExp(`prisma\\.${model}\\.(findMany|findFirst|count|aggregate)\\(\\{\\s*(?!.*where:)([^}]*)\\}\\)`, 'gs');
    // content = content.replace(regexObjNoWhere, (match, method, inner) => { ... }); (Too complex for simple regex)
  }

  // Very targeted injection: if we find `where: {`, replace it with `where: { ...(await withCompany()),`
  // but only if it's not already injected.
  if (!content.includes('...(await withCompany())')) {
    content = content.replace(/where:\s*\{/g, 'where: { ...(await withCompany()),');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Updated ${filePath}`);
  }
});

console.log(`Done. Updated ${count} files.`);
