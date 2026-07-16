import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Check Admin/CEO users in the `User` table (we look at `Account` for password)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (user && user.accounts && user.accounts.length > 0) {
      const account = user.accounts[0]; // Assuming first account holds the password
      if (account.password) {
        const isMatch = await bcrypt.compare(password, account.password);
        if (isMatch) {
          // Password matches, login as ADMIN
          const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "ADMIN",
          };
          await createSession(payload);
          return NextResponse.json({
            success: true,
            role: "ADMIN",
            user: payload,
          });
        }
      } else {
        // If password is not in account, maybe it's stored directly in user? 
        // Wait, User model doesn't have password. 
        // We'll proceed to check employee if password doesn't match or doesn't exist, though typically we'd just fail if the user exists but password is bad.
        // Actually, if user exists but bad password, we should probably fail. But let's check employee table just in case.
      }
    }

    // 2. If not found or no match in User table, check `Employee` table
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ email: email }, { employeeId: email }],
      },
    });

    if (employee && employee.password) {
      const isMatch = await bcrypt.compare(password, employee.password);
      if (isMatch) {
        // Password matches, login as EMPLOYEE
        const payload = {
          id: employee.id,
          employeeId: employee.employeeId,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          role: "EMPLOYEE",
        };
        await createSession(payload);
        return NextResponse.json({
          success: true,
          role: "EMPLOYEE",
          user: payload,
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
