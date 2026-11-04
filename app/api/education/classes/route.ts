import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getClasses, createClass, deleteClass } from "@/lib/education/educationDb";

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

    const classes = await getClasses(companyId, search);

    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    console.error("GET Academy Classes Error:", error);
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
    const { name, section, subjectCode, subjectName, teacherId, teacherName, schedule, room, capacity } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Class name is required" }, { status: 400 });
    }

    const newClass = await createClass({
      companyId,
      name: name.trim(),
      section: section?.trim() || null,
      subjectCode: subjectCode?.trim() || null,
      subjectName: subjectName?.trim() || null,
      teacherId: teacherId?.trim() || null,
      teacherName: teacherName?.trim() || null,
      schedule: schedule?.trim() || null,
      room: room?.trim() || null,
      capacity: capacity ? Number(capacity) : 40,
    });

    return NextResponse.json({ success: true, data: newClass });
  } catch (error: any) {
    console.error("POST Academy Class Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getCompanyId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Class ID required" }, { status: 400 });
    }

    await deleteClass(id, companyId);

    return NextResponse.json({ success: true, message: "Class deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Academy Class Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
