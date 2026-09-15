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
        userId: true,
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

    const staffList = employees.map((e) => {
      const fullName = `${e.firstName || ""} ${e.lastName || ""}`.trim();
      const displayName = fullName || e.employeeId || e.email?.split("@")[0] || "Staff Member";
      return {
        id: e.id,
        userId: e.userId || null,
        employeeId: e.employeeId,
        name: displayName,
        role: e.designation || "Staff",
        type: "STAFF" as const,
        email: e.email,
        department: e.department || "General",
      };
    });

    // Known employee identifiers to prevent duplicate listings & role confusion
    const employeeUserIds = new Set(employees.map((e) => e.userId).filter(Boolean));
    const employeeEmails = new Set(employees.map((e) => e.email?.toLowerCase()).filter(Boolean));

    // 2. Fetch Company Owners & Admins (Users)
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

    // Include ONLY genuine Owners or Admins (never misclassify employee accounts as owners)
    const adminList: any[] = [];
    for (const u of companyUsers) {
      const roleLower = (u.role || "").toLowerCase();
      const isOwner = roleLower.includes("owner") || u.platformRole === "SUPER_ADMIN";
      const isAdmin = roleLower.includes("admin");

      const emailLower = u.email?.toLowerCase() || "";
      const isAlreadyEmployee = employeeUserIds.has(u.id) || (emailLower && employeeEmails.has(emailLower));

      // Skip employee accounts from the admin/owner list
      if (isAlreadyEmployee && !isOwner) {
        continue;
      }
      if (!isOwner && !isAdmin) {
        continue;
      }

      const roleName = isOwner ? "Owner" : "Admin";
      adminList.push({
        id: u.id,
        name: u.name || u.email?.split("@")[0] || roleName,
        role: roleName,
        type: "ADMIN" as const,
        email: u.email,
        department: "Leadership",
        avatar: u.image || null,
      });
    }

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

    // Deduplicated team list (Leadership first, then unique staff)
    const seenKeys = new Set<string>();
    const combinedStaff: any[] = [];

    for (const admin of adminList) {
      const key = (admin.email || admin.name).toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        combinedStaff.push(admin);
      }
    }

    for (const staff of staffList) {
      const emailKey = staff.email ? staff.email.toLowerCase() : "";
      const nameKey = staff.name.toLowerCase();
      if ((emailKey && seenKeys.has(emailKey)) || seenKeys.has(nameKey)) {
        continue;
      }
      if (emailKey) seenKeys.add(emailKey);
      seenKeys.add(nameKey);
      combinedStaff.push(staff);
    }

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
