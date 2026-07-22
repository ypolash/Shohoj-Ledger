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
    const { name, designation, email, phone, mobile, birthday, notes, isPrimary } = body;
    const clientId = params.id;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId }
    });

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const newContact = await prisma.$transaction(async (tx) => {
      // If setting this to primary, unset others
      if (isPrimary) {
        await tx.clientContact.updateMany({
          where: { clientId, companyId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      const c = await tx.clientContact.create({
        data: {
          companyId,
          clientId,
          name,
          designation,
          email,
          phone,
          mobile,
          birthday: birthday ? new Date(birthday) : null,
          notes,
          isPrimary: isPrimary || false
        }
      });

      await tx.clientActivity.create({
        data: {
          companyId,
          clientId,
          type: "UPDATED",
          description: `Added contact person: ${name}`,
          performedById: session.user.id
        }
      });

      return c;
    });

    return NextResponse.json({ contact: newContact });
  } catch (error) {
    console.error("POST Client Contact Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
