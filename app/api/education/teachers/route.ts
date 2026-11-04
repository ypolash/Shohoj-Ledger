import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getTeachers, createTeacher, deleteTeacher } from "@/lib/education/educationDb";

export async function GET(req: Request) {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const teachers = await getTeachers(companyId, search);

    return NextResponse.json({ success: true, data: teachers });
  } catch (error: any) {
    console.error("GET Academy Teachers Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      teacherId,
      email,
      phone,
      designation,
      department,
      salary,
      compensationType,
      projectRate,
      status,
      joiningDate,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Teacher name is required" }, { status: 400 });
    }

    const newTeacher = await createTeacher({
      companyId,
      name: name.trim(),
      teacherId: teacherId?.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      designation: designation?.trim() || null,
      department: department?.trim() || null,
      salary: salary ? Number(salary) : 0,
      compensationType: compensationType || "SALARY",
      projectRate: projectRate ? Number(projectRate) : 0,
      status: status || "ACTIVE",
      joiningDate: joiningDate ? new Date(joiningDate) : null,
    });

    return NextResponse.json({ success: true, data: newTeacher });
  } catch (error: any) {
    console.error("POST Academy Teacher Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Teacher ID required" }, { status: 400 });
    }

    await deleteTeacher(id, companyId);

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Academy Teacher Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
