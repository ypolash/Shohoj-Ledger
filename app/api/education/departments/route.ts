import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import {
  getAcademyDepartments,
  createAcademyDepartment,
  deleteAcademyDepartment,
} from "@/lib/education/educationDb";

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

    const departments = await getAcademyDepartments(companyId, search);

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    console.error("GET Academic Departments Error:", error);
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
    const { name, code, description, headOfDepartment } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
    }

    const newDept = await createAcademyDepartment({
      companyId,
      name: name.trim(),
      code: code?.trim() || null,
      description: description?.trim() || null,
      headOfDepartment: headOfDepartment?.trim() || null,
    });

    return NextResponse.json({ success: true, data: newDept });
  } catch (error: any) {
    console.error("POST Academic Department Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Department ID required" }, { status: 400 });
    }

    await deleteAcademyDepartment(id, companyId);

    return NextResponse.json({ success: true, message: "Department deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Academic Department Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
