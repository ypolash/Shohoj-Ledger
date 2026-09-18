import { NextResponse } from "next/server";
import { executePasswordReset } from "@/lib/auth/passwordReset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token?.trim();
    const code = body?.code?.trim();
    const email = body?.email?.trim();
    const newPassword = body?.newPassword;
    const confirmPassword = body?.confirmPassword;

    if (!token && !code) {
      return NextResponse.json(
        { success: false, message: "A reset token or 6-digit verification code is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, message: "Please provide a valid new password." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New password and confirmation password do not match." },
        { status: 400 }
      );
    }

    const result = await executePasswordReset({
      token,
      code,
      email,
      newPassword,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while resetting the password." },
      { status: 500 }
    );
  }
}
