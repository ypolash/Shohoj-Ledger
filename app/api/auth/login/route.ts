import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { verifyPassword } from "better-auth/crypto";
import { getCompanyContext } from "@/lib/auth/getCompanyContext";

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
      const account = user.accounts.find(a => a.password); // Find the account that actually has a password
      if (account && account.password) {
        // Check bcrypt
        let isMatch = false;
        try {
          isMatch = await bcrypt.compare(password, account.password);
        } catch (e) {
          console.error("Bcrypt compare error:", e);
        }

        // Fallback for better-auth hashed passwords
        if (!isMatch) {
          try {
            isMatch = await verifyPassword({ hash: account.password, password });
          } catch (e) {
            console.error("Better-auth verify error:", e);
          }
        }

        // Fallback for plaintext or if they manually inserted passwords in DB for testing
        if (!isMatch && account.password === password) {
          isMatch = true;
        }

        if (isMatch) {
          console.log("✓ Authentication: Password verified (User)");
          // Password matches, login as ADMIN
          const context = await getCompanyContext(user.id, "ADMIN");
          console.log("✓ Company Context resolved:", context.companyId ? "Yes" : "No");
          
          if (context.roleId) {
            console.log("✓ Permissions (Role) loaded:", context.dbRoleName);
          } else if (user.platformRole === "SUPER_ADMIN" || context.dbRoleName === "Owner") {
            console.log("✓ Permissions Bypass granted for:", context.dbRoleName || user.platformRole);
          } else {
            console.log("✗ Permission Missing: No roleId assigned");
          }

          const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            loginType: "ADMIN",
            role: context.dbRoleName || "Member", // Use actual role from DB for RBAC
            ...context,
          };
          
          await createSession(payload);
          console.log("✓ Session/JWT Created");

          return NextResponse.json({
            success: true,
            role: context.dbRoleName || "Member",
            user: payload,
          });
        }
      }
    }

    // 2. If not found or no match in User table, check `Employee` table
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ email: email }, { employeeId: email }],
      },
    });

    if (employee && employee.password) {
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, employee.password);
      } catch (e) {
        console.error("Bcrypt compare error:", e);
      }

      // Fallback for plaintext testing passwords
      if (!isMatch && employee.password === password) {
        isMatch = true;
      }

      if (isMatch) {
        console.log("✓ Authentication: Password verified (Employee)");
        // Password matches, login as EMPLOYEE
        const context = await getCompanyContext(employee.id, "EMPLOYEE");
        console.log("✓ Company Context resolved:", context.companyId ? "Yes" : "No");

        if (context.roleId) {
          console.log("✓ Permissions (Role) loaded:", context.dbRoleName);
        } else {
          console.log("✗ Permission Missing: No roleId assigned");
        }

        const payload = {
          id: employee.id,
          employeeId: employee.employeeId,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          loginType: "EMPLOYEE",
          role: context.dbRoleName || "Employee", // Use actual role from DB for RBAC
          ...context,
        };
        
        await createSession(payload);
        console.log("✓ Session/JWT Created");

        return NextResponse.json({
          success: true,
          role: context.dbRoleName || "Employee",
          user: payload,
        });
      }
    }

    console.log("✗ Authentication Failed: Invalid credentials");
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
