import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EDIT_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, type, fileUrl } = body;
    const clientId = params.id;

    if (!name || !type || !fileUrl) {
      return NextResponse.json({ error: "Name, Type, and File URL are required" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId }
    });

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const newDoc = await prisma.$transaction(async (tx) => {
      const d = await tx.clientDocument.create({
        data: {
          companyId,
          clientId,
          name,
          type,
          fileUrl,
          uploadedById: session.user.id
        }
      });

      await tx.clientActivity.create({
        data: {
          companyId,
          clientId,
          type: "DOC_UPLOADED",
          description: `Uploaded document: ${name} (${type})`,
          performedById: session.user.id
        }
      });

      return d;
    });

    return NextResponse.json({ document: newDoc });
  } catch (error) {
    console.error("POST Client Document Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
