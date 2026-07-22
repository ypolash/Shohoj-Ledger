import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    let preference = await prisma.notificationPreference.findUnique({
      where: { companyId_userId: { companyId, userId } }
    });

    if (!preference) {
      preference = await prisma.notificationPreference.create({
        data: { companyId, userId }
      });
    }

    return NextResponse.json({ preference });
  } catch (error) {
    console.error("GET Preferences Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();

    const preference = await prisma.notificationPreference.upsert({
      where: { companyId_userId: { companyId, userId } },
      update: {
        emailEnabled: body.emailEnabled,
        inAppEnabled: body.inAppEnabled,
        smsEnabled: body.smsEnabled,
        pushEnabled: body.pushEnabled,
        mutedCategories: body.mutedCategories,
        digestMode: body.digestMode,
        workingHoursStart: body.workingHoursStart,
        workingHoursEnd: body.workingHoursEnd,
      },
      create: {
        companyId,
        userId,
        emailEnabled: body.emailEnabled ?? true,
        inAppEnabled: body.inAppEnabled ?? true,
        smsEnabled: body.smsEnabled ?? false,
        pushEnabled: body.pushEnabled ?? false,
        mutedCategories: body.mutedCategories ?? [],
        digestMode: body.digestMode ?? false,
        workingHoursStart: body.workingHoursStart,
        workingHoursEnd: body.workingHoursEnd,
      }
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error("PATCH Preferences Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
