import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ApiErrorHandler } from "@/lib/security/errorHandler";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Attempt to find existing preferences for this user/company
    let prefs = await prisma.notificationPreference.findUnique({
      where: {
        companyId_userId: {
          companyId: session.companyId,
          userId: session.id,
        },
      },
    });

    // If none exist, create default preferences (All enabled by default per user request)
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          companyId: session.companyId,
          userId: session.id,
          emailEnabled: true,
          inAppEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    return ApiErrorHandler.handle(error, "GET_NOTIFICATION_PREFS");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    const updatedPrefs = await prisma.notificationPreference.upsert({
      where: {
        companyId_userId: {
          companyId: session.companyId,
          userId: session.id,
        },
      },
      update: {
        emailEnabled: payload.emailEnabled,
        inAppEnabled: payload.inAppEnabled,
        smsEnabled: payload.smsEnabled,
        pushEnabled: payload.pushEnabled,
      },
      create: {
        companyId: session.companyId,
        userId: session.id,
        emailEnabled: payload.emailEnabled ?? true,
        inAppEnabled: payload.inAppEnabled ?? true,
        smsEnabled: payload.smsEnabled ?? true,
        pushEnabled: payload.pushEnabled ?? true,
      },
    });

    return NextResponse.json({ success: true, data: updatedPrefs });
  } catch (error) {
    return ApiErrorHandler.handle(error, "UPDATE_NOTIFICATION_PREFS");
  }
}
