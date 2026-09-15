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

    // 1. Fetch Company Owners & Admins (Users)
    const companyUsers = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        platformRole: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    const adminList = companyUsers.map((u) => {
      const isOwner = (u.role || "").toLowerCase().includes("owner") || u.platformRole === "SUPER_ADMIN";
      const roleName = isOwner ? "Owner" : u.role || "Admin";
      return {
        id: u.id,
        name: u.name || u.email?.split("@")[0] || "Admin",
        role: roleName,
        type: "ADMIN" as const,
        email: u.email,
        department: "Leadership",
        avatar: u.image || null,
      };
    });

    // 2. Fetch Staff (Employees)
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        department: true,
        status: true,
      },
      orderBy: { firstName: "asc" },
    });

    // 3. Fetch Members
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

    const staffList = employees.map((e) => {
      const fullName = `${e.firstName || ""} ${e.lastName || ""}`.trim();
      const displayName = fullName || e.employeeId || e.email?.split("@")[0] || "Staff Member";
      return {
        id: e.id,
        employeeId: e.employeeId,
        name: displayName,
        role: e.designation || "Staff",
        type: "STAFF" as const,
        email: e.email,
        department: e.department || "General",
      };
    });

    const memberList = members.map((m) => ({
      id: m.id,
      name: m.name || m.phone || "Member",
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

    // Combined team list (Admins/Owners + Staff) for directory and mentions
    const combinedStaff = [...adminList, ...staffList];

    return NextResponse.json({
      success: true,
      admins: adminList,
      staff: combinedStaff,
      members: memberList,
      currentUser: {
        id: session.user.id,
        employeeId: session.user.employeeId || null,
        name: session.user.name || (currentType === "ADMIN" ? "Owner" : "Staff Member"),
        role: session.user.role || (currentType === "ADMIN" ? "Owner" : "Staff"),
        type: currentType,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Fetch community members error:", error);
    return NextResponse.json({ error: "Failed to load directory" }, { status: 500 });
  }
}
