const fs = require('fs');
const path = require('path');

const files = [
  'app/api/crm/sales-orders/[id]/route.ts',
  'app/api/crm/sales-orders/route.ts',
  'app/api/crm/sales-orders/[id]/status/route.ts',
  'app/api/crm/quotations/[id]/route.ts',
  'app/api/crm/quotations/[id]/status/route.ts',
  'app/api/crm/quotations/route.ts'
];

files.forEach(file => {
  const fullPath = path.join('/home/polash/Shohoj/Shohoj Ledger', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes('import { getSession }')) {
      content = content.replace(/import { NextResponse } from "next\/server";/, 'import { NextResponse } from "next/server";\nimport { getSession } from "@/lib/session";');
    }
    
    const oldStr = 'const userId = req.headers.get("x-user-id");';
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
