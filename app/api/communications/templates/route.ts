import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_TEMPLATES");
    if (rbacGuard) return rbacGuard;

    const templates = await prisma.notificationTemplate.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET Templates Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_TEMPLATES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, category, subject, body: templateBody, channels } = body;

    if (!name || !category || !subject || !templateBody) {
      return NextResponse.json({ error: "Name, Category, Subject, and Body are required" }, { status: 400 });
    }

    const template = await prisma.$transaction(async (tx) => {
      const t = await tx.notificationTemplate.create({
        data: {
          companyId,
          name,
          category,
          subject,
          body: templateBody,
          channels: channels || ["IN_APP"]
        }
      });

      await tx.notificationAudit.create({
        data: {
          companyId,
          action: "TEMPLATE_UPDATED",
          entityType: "TEMPLATE",
          entityId: t.id,
          description: `Created template: ${name}`,
          performedById: session.user.id
        }
      });

      return t;
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("POST Template Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
