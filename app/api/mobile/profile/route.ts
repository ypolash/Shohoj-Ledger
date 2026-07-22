import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { ...(await withCompany()), employeeId },
      include: {
        // If there's a related user for the image
        // user: true
      }
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
            where: { ...(await withCompany()), id: employee.userId }
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
