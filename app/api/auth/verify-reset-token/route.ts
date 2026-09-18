import { NextResponse } from "next/server";
import { verifyResetTokenOrCode } from "@/lib/auth/passwordReset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token?.trim();
    const code = body?.code?.trim();
    const email = body?.email?.trim();

    if (!token && !code) {
      return NextResponse.json(
        { success: false, valid: false, message: "A reset token or 6-digit verification code is required." },
        { status: 400 }
      );
    }

    const result = await verifyResetTokenOrCode({ token, code, email });

    if (!result.valid) {
      return NextResponse.json(
        { success: false, valid: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: result.email,
      userName: result.userName,
      accountType: result.accountType,
      message: result.message,
    });
  } catch (error) {
    console.error("Verify Reset Token Error:", error);
    return NextResponse.json(
      { success: false, valid: false, message: "An unexpected error occurred while verifying the token." },
      { status: 500 }
    );
  }
}
