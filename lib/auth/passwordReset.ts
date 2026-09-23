import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { EmailService } from "@/lib/email/emailService";

export interface ResetRequestResult {
  success: boolean;
  message: string;
  email?: string;
  token?: string;
  code?: string;
  userName?: string;
  accountType?: "USER" | "EMPLOYEE";
  isEmailVerified?: boolean;
}

export interface VerifyTokenResult {
  valid: boolean;
  message: string;
  email?: string;
  userName?: string;
  accountType?: "USER" | "EMPLOYEE";
  userId?: string;
  companyId?: string | null;
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
  let targetCompanyId: string | null = null;
  let isEmailVerified = false;

  if (user) {
    targetType = "USER";
    targetUserId = user.id;
    targetEmail = user.email;
    targetName = user.name || "User";
    targetCompanyId = user.companyId || null;
    isEmailVerified = user.emailVerified;
  } else {
    // Check in Employee table (by email, employeeId, or phone)
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: "insensitive" } },
          { employeeId: { equals: identifier.trim(), mode: "insensitive" } },
          { phone: { equals: identifier.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (employee) {
      targetType = "EMPLOYEE";
      targetUserId = employee.id;
      targetEmail = employee.email;
      targetName = `${employee.firstName} ${employee.lastName}`.trim();
      targetCompanyId = employee.companyId || null;

      // Check linked user for verification status
      if (employee.userId) {
        const linkedUser = await prisma.user.findUnique({ where: { id: employee.userId } });
        if (linkedUser) {
          isEmailVerified = linkedUser.emailVerified;
        }
      }
    } else {
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
    companyId: targetCompanyId,
  };

  await prisma.verification.create({
    data: {
      identifier: identifierKey,
      value: JSON.stringify(tokenPayload),
      expiresAt,
    },
  });

  const resetUrl = `/reset-password?token=${token}&email=${encodeURIComponent(targetEmail)}`;

  // Dispatch email with reset code & link
  try {
    await EmailService.sendPasswordResetEmail({
      to: targetEmail,
      userName: targetName,
      code,
      resetUrl,
    });
  } catch (mErr) {
    console.warn("Could not dispatch password reset email via transport:", mErr);
  }

  console.log(`[AUTH] Password reset requested for ${targetEmail}. Code: ${code}, Token: ${token.slice(0, 10)}...`);

  return {
    success: true,
    message: `Password reset instructions and verification code have been dispatched to ${targetEmail}.`,
    email: targetEmail,
    token,
    code,
    userName: targetName,
    accountType: targetType,
    isEmailVerified,
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
          companyId: payload.companyId,
        };
      }
    } catch {
      continue;
    }
  }

  return {
    valid: false,
    message: "This password reset link or 6-digit code is invalid, expired, or has already been used.",
  };
}

/**
 * 3. Reset Password and synchronize Account & Employee credentials
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

  const targetEmail = verification.email.toLowerCase();

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 1. Sync User / Account table
  const user = await prisma.user.findFirst({
    where: { email: { equals: targetEmail, mode: "insensitive" } },
    include: { accounts: true },
  });

  if (user) {
    // Mark email as verified since OTP was confirmed via this email address
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    // Update or create Account password
    const existingAccount = user.accounts?.find((a) => a.password) || user.accounts?.[0];
    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.email,
          providerId: "credentials",
          password: hashedPassword,
        },
      });
    }
  }

  // 2. Sync Employee table (by email or userId)
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: { equals: targetEmail, mode: "insensitive" } },
        ...(user ? [{ userId: user.id }] : []),
        { id: verification.userId },
      ],
    },
  });

  if (employee) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  // 3. Clean up consumed verification tokens for this user
  const identifierKey = `password-reset:${targetEmail}`;
  try {
    await prisma.verification.deleteMany({
      where: { identifier: identifierKey },
    });
  } catch (e) {
    console.warn("Could not delete consumed verification record:", e);
  }

  // 4. Send Confirmation Security Email
  try {
    await EmailService.sendPasswordResetConfirmationEmail({
      to: targetEmail,
      userName: verification.userName || "Valued User",
    });
  } catch (e) {
    console.warn("Could not send confirmation email:", e);
  }

  // 5. In-App Notification if user exists
  if (user && user.companyId) {
    try {
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          category: "SYSTEM",
          title: "Password Updated",
          message: "Your account password was successfully updated via password recovery.",
          priority: "HIGH",
          channel: "IN_APP",
        },
      });
    } catch (nErr) {
      console.warn("Could not create security in-app notification:", nErr);
    }
  }

  console.log(`[AUTH] Password successfully reset and synchronized for ${targetEmail}`);

  return {
    success: true,
    message: "Your password has been successfully reset! You can now sign in with your new credentials.",
  };
}
