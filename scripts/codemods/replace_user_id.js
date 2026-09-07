const fs = require('fs');
const path = require('path');

const files = [
  'app/api/crm/opportunities/[id]/route.ts',
  'app/api/crm/opportunities/pipelines/[id]/route.ts',
  'app/api/crm/opportunities/pipelines/route.ts',
  'app/api/crm/opportunities/[id]/status/route.ts',
  'app/api/crm/opportunities/[id]/activities/route.ts',
  'app/api/crm/customers/[id]/addresses/route.ts',
  'app/api/crm/customers/[id]/contacts/route.ts',
  'app/api/crm/customers/route.ts',
  'app/api/crm/opportunities/route.ts',
  'app/api/crm/customers/[id]/documents/route.ts',
  'app/api/crm/customers/groups/route.ts'
];

files.forEach(file => {
  const fullPath = path.join('/home/polash/Shohoj/Shohoj Ledger', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not present
    if (!content.includes('import { getSession }')) {
      content = content.replace(/import { NextResponse } from "next\/server";/, 'import { NextResponse } from "next/server";\nimport { getSession } from "@/lib/session";');
    }
    
    // Replace placeholder logic
    const oldStr = 'const userId = request.headers.get("x-user-id") || "system";';
    const newStr = `const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });`;
    
    if (content.includes(oldStr)) {
      content = content.replaceAll(oldStr, newStr);
      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + file);
    }
  }
});
