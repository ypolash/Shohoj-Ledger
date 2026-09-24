import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { listFollowUps, createFollowUp } from "@/lib/crm/followUpService";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const take = parseInt(searchParams.get("take") || "50", 10);

    const result = await listFollowUps(companyId, {
      search,
      status,
      type,
      priority,
      customerId,
      from,
      to,
      skip,
      take,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/crm/follow-ups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await getSession();
    let userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure valid User ID
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
          return NextResponse.json(
            { error: "No user found to assign as creator." },
            { status: 403 }
          );
        }
      }
    }

    const data = await request.json();

    const activity = await createFollowUp(companyId, userId, data);
    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/crm/follow-ups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
