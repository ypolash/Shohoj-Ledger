const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./app/api');
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Regex to match: export async function GET(req: Request, { params }: { params: { id: string } }) {
  // It handles any method name, and any inner object for params
  const regex = /export async function ([A-Z]+)\(\s*(req|request)\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*([^}]+})\s*\}\s*\)\s*\{/g;

  content = content.replace(regex, (match, method, reqName, paramsType) => {
    return `export async function ${method}(${reqName}: Request, context: { params: Promise<${paramsType}> }) {\n  const params = await context.params;`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    modifiedCount++;
  }
}

console.log(`Modified ${modifiedCount} files.`);
