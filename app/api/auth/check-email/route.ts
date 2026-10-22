import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required." }, { status: 400 });
    }

    // Check if user already exists with this email (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" }
      },
      select: {
        id: true,
        email: true
      }
    });

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: "This email address is already registered to an account. Please log in or use a different email."
      });
    }

    return NextResponse.json({
      available: true,
      message: "Email is available."
    });
  } catch (error) {
    console.error("Check email availability error:", error);
    return NextResponse.json({ error: "Failed to check email availability." }, { status: 500 });
  }
}
