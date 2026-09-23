import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { EmailService } from "@/lib/email/emailService";

export interface VerificationResult {
  success: boolean;
  message: string;
  email?: string;
  userName?: string;
  token?: string;
  code?: string;
}

/**
 * 1. Generate and Send Email Verification OTP & Link
 */
export async function sendVerificationEmail(
  email: string,
  userId?: string,
  userName?: string
): Promise<VerificationResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: "Please provide a valid email address." };
  }

  // Find user details if not provided
  let targetName = userName || "Valued User";
  let targetUserId = userId;

  if (!targetUserId || !userName) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    if (user) {
      targetUserId = user.id;
      targetName = user.name || "Valued User";
    }
  }

  // Generate 64-char crypto token and 6-digit numeric OTP code
  const token = crypto.randomBytes(32).toString("hex");
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. "592817"
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const identifierKey = `email-verification:${cleanEmail}`;

  // Purge any prior pending verification requests for this email
  try {
    await prisma.verification.deleteMany({
      where: { identifier: identifierKey },
    });
  } catch (e) {
    console.warn("Could not clean old verification records:", e);
  }

  const tokenPayload = {
    token,
    code,
    userId: targetUserId,
    email: cleanEmail,
    userName: targetName,
  };

  await prisma.verification.create({
    data: {
      identifier: identifierKey,
      value: JSON.stringify(tokenPayload),
      expiresAt,
    },
  });

  const verificationUrl = `/verify-email?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  // Dispatch email
  await EmailService.sendVerificationEmail({
    to: cleanEmail,
    userName: targetName,
    code,
    verificationUrl,
  });

  console.log(`[AUTH] Verification email dispatched to ${cleanEmail}. Code: ${code}`);

  return {
    success: true,
    message: "A verification code has been dispatched to your email address.",
    email: cleanEmail,
    userName: targetName,
    token,
    code,
  };
}

/**
 * 2. Verify Email via 6-digit OTP Code or URL Token
 */
export async function verifyEmailCodeOrToken({
  email,
  token,
  code,
}: {
  email?: string;
  token?: string;
  code?: string;
}): Promise<VerificationResult> {
  const now = new Date();

  let records = [];
  if (email) {
    const identifierKey = `email-verification:${email.trim().toLowerCase()}`;
    records = await prisma.verification.findMany({
      where: {
        identifier: identifierKey,
        expiresAt: { gt: now },
      },
    });
  } else {
    records = await prisma.verification.findMany({
      where: {
        identifier: { startsWith: "email-verification:" },
        expiresAt: { gt: now },
      },
    });
  }

  let matchedRecord = null;
  let matchedPayload: any = null;

  for (const record of records) {
    try {
      const payload = JSON.parse(record.value);
      const tokenMatch = token && payload.token === token.trim();
      const codeMatch = code && payload.code === code.trim();

      if (tokenMatch || codeMatch) {
        matchedRecord = record;
        matchedPayload = payload;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!matchedRecord || !matchedPayload) {
    return {
      success: false,
      message: "The verification link or 6-digit code is invalid, expired, or has already been used.",
    };
  }

  const targetEmail = matchedPayload.email;

  // Mark user's email as verified in database
  await prisma.user.updateMany({
    where: { email: { equals: targetEmail, mode: "insensitive" } },
    data: { emailVerified: true },
  });

  // Clean up consumed verification record
  try {
    await prisma.verification.delete({
      where: { id: matchedRecord.id },
    });
  } catch (e) {
    console.warn("Could not delete consumed email verification record:", e);
  }

  console.log(`[AUTH] Email verified successfully for: ${targetEmail}`);

  return {
    success: true,
    message: "Your email address has been successfully verified!",
    email: targetEmail,
    userName: matchedPayload.userName,
  };
}
