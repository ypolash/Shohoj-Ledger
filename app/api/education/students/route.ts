import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getStudents, createStudent, deleteStudent } from "@/lib/education/educationDb";

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

    const students = await getStudents(companyId, search);

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    console.error("GET Academy Students Error:", error);
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
      studentId,
      email,
      phone,
      gender,
      guardianName,
      guardianPhone,
      className,
      schoolOrCollege,
      status,
      admissionDate,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Student name is required" }, { status: 400 });
    }

    const newStudent = await createStudent({
      companyId,
      name: name.trim(),
      studentId: studentId?.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      gender: gender?.trim() || "Male",
      guardianName: guardianName?.trim() || null,
      guardianPhone: guardianPhone?.trim() || null,
      className: className?.trim() || null,
      schoolOrCollege: schoolOrCollege?.trim() || null,
      status: status || "ACTIVE",
      admissionDate: admissionDate ? new Date(admissionDate) : null,
    });

    return NextResponse.json({ success: true, data: newStudent });
  } catch (error: any) {
    console.error("POST Academy Student Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID required" }, { status: 400 });
    }

    await deleteStudent(id, companyId);

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Academy Student Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
