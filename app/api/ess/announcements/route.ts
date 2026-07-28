import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/ess/announcements
 * Returns company-wide announcements (mocked via company info for now).
 * In V2, this can be wired to a dedicated Announcement model.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = session.user;

    // Currently using a placeholder since there's no Announcement model yet.
    // When a proper Announcement model is added, replace this with:
    // await prisma.announcement.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
    const mockAnnouncements = [
      {
        id: "1",
        title: "Welcome to the Staff Portal",
        content: "This is your personal employee portal. View payslips, leave requests, and more.",
        type: "INFO",
        createdAt: new Date().toISOString(),
        author: "HR Department",
      },
      {
        id: "2",
        title: "Payroll Processed for This Month",
        content: "Salaries for this month have been processed and will reflect in your accounts within 24 hours.",
        type: "PAYROLL",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Finance Department",
      },
      {
        id: "3",
        title: "Office Holiday: Eid-ul-Adha",
        content: "The office will remain closed on Eid. Enjoy the holiday!",
        type: "HOLIDAY",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Administration",
      },
    ];

    return NextResponse.json({ announcements: mockAnnouncements });
  } catch (error) {
    console.error("[ESS] Announcements fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
