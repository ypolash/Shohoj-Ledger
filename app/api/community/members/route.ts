import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company context required" }, { status: 400 });
    }

    // 1. Fetch Staff (Employees)
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        department: true,
        status: true,
      },
      orderBy: { firstName: "asc" },
    });

    // 2. Fetch Members
    const members = await prisma.member.findMany({
      where: { companyId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    const staffList = employees.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`.trim(),
      role: e.designation || "Staff",
      type: "STAFF" as const,
      email: e.email,
      department: e.department || "General",
    }));

    const memberList = members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role || "Member",
      type: "MEMBER" as const,
      email: m.email,
      phone: m.phone,
    }));

    const currentType =
      session.user.loginType === "EMPLOYEE"
        ? "STAFF"
        : session.user.loginType === "ADMIN" || session.user.role === "Admin" || session.user.role === "Owner"
        ? "ADMIN"
        : "MEMBER";

    return NextResponse.json({
      success: true,
      staff: staffList,
      members: memberList,
      currentUser: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role || "Member",
        type: currentType,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Fetch community members error:", error);
    return NextResponse.json({ error: "Failed to load directory" }, { status: 500 });
  }
}
