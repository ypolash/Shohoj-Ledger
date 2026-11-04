import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getFeesAndSummary, createFee, recordFeePayment } from "@/lib/education/educationDb";

export async function GET(req: Request) {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    const data = await getFeesAndSummary(companyId, status);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("GET Academy Finance Error:", error);
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
    const { action, id, studentId, studentName, feeType, amount, paidAmount, dueDate } = body;

    // 1. Mark existing fee payment
    if (action === "RECORD_PAYMENT" && id) {
      const paymentAmt = Number(paidAmount) || 0;
      const updated = await recordFeePayment(id, companyId, paymentAmt);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Fee record not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    // 2. Issue new Fee Invoice
    if (!studentName?.trim()) {
      return NextResponse.json({ success: false, error: "Student name is required" }, { status: 400 });
    }

    const newFee = await createFee({
      companyId,
      studentId: studentId?.trim(),
      studentName: studentName.trim(),
      feeType: feeType || "Tuition Fee",
      amount: Number(amount) || 0,
      paidAmount: Number(paidAmount) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    return NextResponse.json({ success: true, data: newFee });
  } catch (error: any) {
    console.error("POST Academy Finance Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
