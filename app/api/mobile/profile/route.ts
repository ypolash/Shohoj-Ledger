import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // Ensure employees can only request their own data
    if (session.user.loginType === "EMPLOYEE" && session.user.employeeId !== employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Try to find user image if userId exists
    let profileImage = null;
    if (employee.userId) {
        const user = await prisma.user.findUnique({
            where: { id: employee.userId }
        });
        profileImage = user?.image;
    }

    const profile = {
      id: employee.id,
      fullName: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.employeeId,
      designation: employee.designation,
      department: employee.department || "N/A",
      joinDate: employee.joinDate.toISOString().split('T')[0],
      phone: employee.phone || "N/A",
      email: employee.email,
      profileImage: profileImage,
      isActive: employee.status === "ACTIVE"
    };

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
