import { NextResponse } from "next/server";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/announcements
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/announcements
 * Returns company-wide announcements.
 */
export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const { companyId } = employee;

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
