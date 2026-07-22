import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reportName, action, format, filters } = body;

    if (!reportName || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const audit = await prisma.reportAudit.create({
      data: {
        companyId,
        userId: session.userId,
        reportName,
        action, // "GENERATED", "EXPORTED", "PRINTED"
        format, // "CSV", "PDF", etc.
        filters: filters ? JSON.stringify(filters) : null,
      }
    });

    return NextResponse.json({ audit });
  } catch (error) {
    console.error("Report audit logging error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
