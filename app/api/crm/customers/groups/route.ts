import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerGroupService } from "@/lib/crm/customerGroupService";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groups = await customerGroupService.getGroups(companyId);
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const session = await getSession();
    let userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    
    const { prisma } = await import("@/lib/prisma");
    
    // Ensure userId resolves to a valid User.id for relations
    let validUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!validUser) {
      const employee = await prisma.employee.findUnique({ where: { id: userId } });
      if (employee?.userId) {
        validUser = await prisma.user.findUnique({ where: { id: employee.userId } });
        if (validUser) userId = validUser.id;
      }
      
      if (!validUser) {
        const fallbackUser = await prisma.user.findFirst({ where: { companyId } });
        if (fallbackUser) {
          userId = fallbackUser.id;
        } else {
          return NextResponse.json({ error: "No user available to assign creator role." }, { status: 403 });
        }
      }
    }
    
    const group = await customerGroupService.createCustomerGroup(companyId, userId, data);
    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
