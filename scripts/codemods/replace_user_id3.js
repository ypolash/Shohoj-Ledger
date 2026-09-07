const fs = require('fs');
const path = require('path');

const files = [
  'app/api/crm/quotations/[id]/route.ts',
  'app/api/crm/quotations/[id]/status/route.ts',
  'app/api/crm/quotations/route.ts',
  'app/api/crm/sales-orders/[id]/route.ts',
  'app/api/crm/sales-orders/[id]/status/route.ts',
  'app/api/crm/sales-orders/route.ts'
];

files.forEach(file => {
  const fullPath = path.join('/home/polash/Shohoj/Shohoj Ledger', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes('import { getSession }')) {
      content = content.replace(/import { NextRequest, NextResponse } from "next\/server";/, 'import { NextRequest, NextResponse } from "next/server";\nimport { getSession } from "@/lib/session";');
      fs.writeFileSync(fullPath, content);
      console.log('Fixed import in ' + file);
    }
  }
});
