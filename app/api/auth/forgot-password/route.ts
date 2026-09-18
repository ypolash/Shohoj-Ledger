import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/passwordReset";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body?.email || body?.employeeId || body?.identifier;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your registered Email Address or Employee ID." },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(identifier);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.email,
      userName: result.userName,
      // Provide token and code for direct client-side convenience and preview
      token: result.token,
      code: result.code,
      resetUrl: `/reset-password?token=${result.token}&email=${encodeURIComponent(result.email || "")}`,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request. Please try again." },
      { status: 500 }
    );
  }
}
