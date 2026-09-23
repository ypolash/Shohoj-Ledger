import { NextResponse } from "next/server";
import { verifyEmailCodeOrToken } from "@/lib/auth/emailVerification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token?.trim();
    const code = body?.code?.trim();
    const email = body?.email?.trim();

    if (!token && !code) {
      return NextResponse.json(
        { success: false, message: "Please provide a verification token or 6-digit OTP code." },
        { status: 400 }
      );
    }

    const result = await verifyEmailCodeOrToken({ token, code, email });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.email,
      userName: result.userName,
    });
  } catch (error) {
    console.error("Email Verification Route Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}
