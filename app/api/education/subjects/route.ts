import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSubjects, createSubject, deleteSubject } from "@/lib/education/educationDb";

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

    const subjects = await getSubjects(companyId, search);

    return NextResponse.json({ success: true, data: subjects });
  } catch (error: any) {
    console.error("GET Academy Subjects Error:", error);
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
    const { code, name, department, creditHours, description, status } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ success: false, error: "Subject code and name are required" }, { status: 400 });
    }

    const newSubject = await createSubject({
      companyId,
      code: code.trim(),
      name: name.trim(),
      department: department?.trim() || null,
      creditHours: creditHours ? Number(creditHours) : 3,
      description: description?.trim() || null,
      status: status || "ACTIVE",
    });

    return NextResponse.json({ success: true, data: newSubject });
  } catch (error: any) {
    console.error("POST Academy Subject Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Subject ID required" }, { status: 400 });
    }

    await deleteSubject(id, companyId);

    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Academy Subject Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
