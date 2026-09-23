import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/auth/emailVerification";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found matching this email address." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "This email address is already verified.", alreadyVerified: true },
        { status: 200 }
      );
    }

    const result = await sendVerificationEmail(user.email, user.id, user.name);

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.email,
      code: result.code, // Useful for dev/preview
    });
  } catch (error) {
    console.error("Send Verification Route Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while sending verification email." },
      { status: 500 }
    );
  }
}
