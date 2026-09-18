import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface ResetRequestResult {
  success: boolean;
  message: string;
  email?: string;
  token?: string;
  code?: string;
  userName?: string;
  accountType?: "USER" | "EMPLOYEE";
}

export interface VerifyTokenResult {
  valid: boolean;
  message: string;
  email?: string;
  userName?: string;
  accountType?: "USER" | "EMPLOYEE";
  userId?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Normalizes email or identifier
 */
function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * 1. Request Password Reset Token & 6-Digit OTP Code
 */
export async function requestPasswordReset(identifier: string): Promise<ResetRequestResult> {
  const cleanId = normalizeIdentifier(identifier);
  if (!cleanId) {
    return { success: false, message: "Please enter a valid email address or employee ID." };
  }

  // Find in User table first
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanId, mode: "insensitive" } },
      ],
    },
    include: { accounts: true },
  });

  let targetType: "USER" | "EMPLOYEE" = "USER";
  let targetUserId = "";
  let targetEmail = "";
  let targetName = "";

  if (user) {
    targetType = "USER";
    targetUserId = user.id;
    targetEmail = user.email;
    targetName = user.name || "User";
  } else {
    // Check in Employee table
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: "insensitive" } },
          { employeeId: { equals: identifier.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (employee) {
      targetType = "EMPLOYEE";
      targetUserId = employee.id;
      targetEmail = employee.email;
      targetName = `${employee.firstName} ${employee.lastName}`.trim();
    } else {
      // Return a safe message to avoid leaking user existence, but inform UI
      return {
        success: false,
        message: "No account found matching this email address or Employee ID. Please check and try again.",
      };
    }
  }

  // Generate 64-char crypto token and 6-digit numeric OTP code
  const token = crypto.randomBytes(32).toString("hex");
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. "482910"
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

  const identifierKey = `password-reset:${targetEmail.toLowerCase()}`;

  // Remove any previous active reset tokens for this user
  try {
    await prisma.verification.deleteMany({
      where: { identifier: identifierKey },
    });
  } catch (e) {
    console.warn("Could not clean previous verification records:", e);
  }

  // Create verification record
  const tokenPayload = {
    token,
    code,
    userId: targetUserId,
    email: targetEmail,
    userName: targetName,
    targetType,
  };

  await prisma.verification.create({
    data: {
      identifier: identifierKey,
      value: JSON.stringify(tokenPayload),
      expiresAt,
    },
  });

  // Log in server console
  console.log(`[AUTH] Password reset requested for ${targetEmail}. Code: ${code}, Token: ${token.slice(0, 10)}...`);

  return {
    success: true,
    message: "Password reset instructions and verification code have been generated.",
    email: targetEmail,
    token,
    code,
    userName: targetName,
    accountType: targetType,
  };
}

/**
 * 2. Verify Reset Token or 6-digit Code
 */
export async function verifyResetTokenOrCode({
  token,
  code,
  email,
}: {
  token?: string;
  code?: string;
  email?: string;
}): Promise<VerifyTokenResult> {
  const now = new Date();

  // If email is provided, lookup by specific identifier
  let records = [];
  if (email) {
    const identifierKey = `password-reset:${email.trim().toLowerCase()}`;
    records = await prisma.verification.findMany({
      where: {
        identifier: identifierKey,
        expiresAt: { gt: now },
      },
    });
  } else {
    // Search all valid active password-reset records
    records = await prisma.verification.findMany({
      where: {
        identifier: { startsWith: "password-reset:" },
        expiresAt: { gt: now },
      },
    });
  }

  for (const record of records) {
    try {
      const payload = JSON.parse(record.value);
      const tokenMatch = token && payload.token === token.trim();
      const codeMatch = code && payload.code === code.trim();

      if (tokenMatch || codeMatch) {
        return {
          valid: true,
          message: "Reset token is valid.",
          email: payload.email,
          userName: payload.userName,
          accountType: payload.targetType,
          userId: payload.userId,
        };
      }
    } catch (err) {
      continue;
    }
  }

  return {
    valid: false,
    message: "This password reset link or code is invalid, expired, or has already been used.",
  };
}

/**
 * 3. Reset Password and update Account or Employee
 */
export async function executePasswordReset({
  token,
  code,
  email,
  newPassword,
}: {
  token?: string;
  code?: string;
  email?: string;
  newPassword: string;
}): Promise<ResetPasswordResult> {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters long.",
    };
  }

  // Verify the token / code first
  const verification = await verifyResetTokenOrCode({ token, code, email });
  if (!verification.valid || !verification.userId || !verification.email) {
    return {
      success: false,
      message: verification.message || "Invalid or expired reset session.",
    };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (verification.accountType === "USER") {
    // Check if account entry exists
    const existingAccount = await prisma.account.findFirst({
      where: { userId: verification.userId },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new account entry with credentials
      await prisma.account.create({
        data: {
          userId: verification.userId,
          accountId: verification.userId,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }
  } else if (verification.accountType === "EMPLOYEE") {
    await prisma.employee.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  // Clean up used verification tokens
  const identifierKey = `password-reset:${verification.email.toLowerCase()}`;
  try {
    await prisma.verification.deleteMany({
      where: { identifier: identifierKey },
    });
  } catch (e) {
    console.warn("Could not delete consumed verification record:", e);
  }

  console.log(`[AUTH] Password successfully reset for ${verification.email} (${verification.accountType})`);

  return {
    success: true,
    message: "Your password has been successfully reset! You can now sign in with your new credentials.",
  };
}
