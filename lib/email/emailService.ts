/**
 * Email Service for Shohoj Ledger
 * Handles dispatching transactional emails including:
 * - Email Verification (OTP & Direct Link)
 * - Password Reset (OTP & Direct Link)
 * - Security Alerts
 *
 * Supports standard SMTP (e.g. Resend, SendGrid, Gmail SMTP, Mailtrap)
 * and falls back gracefully to formatted console telemetry in development.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  /**
   * Generic sender that sends email via SMTP if configured,
   * or outputs formatted telemetry in development.
   */
  static async sendMail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = process.env.SMTP_FROM || "Shohoj Ledger Security <security@shohojsolution.com>";

    if (this.isConfigured()) {
      try {
        // @ts-ignore - Dynamic import to avoid strict dependency issues if nodemailer isn't installed
        const nodemailerModule = await import("nodemailer").catch(() => null);
        if (!nodemailerModule) {
          throw new Error("Nodemailer module is not installed in dependencies.");
        }
        const nodemailer = nodemailerModule.default || nodemailerModule;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          connectionTimeout: 4000,
          greetingTimeout: 3000,
          socketTimeout: 5000,
        });

        const info = await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
        });

        console.log(`[EMAIL DISPATCHED] To: ${options.to} | Subject: "${options.subject}" | MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.warn(`[EMAIL WARNING] SMTP delivery failed, logging email content to server console:`, error);
      }
    }

    // Development & Staging fallback: Print nicely formatted banner in server console
    console.log("\n=======================================================");
    console.log(`📧 [EMAIL EMULATOR] To: ${options.to}`);
    console.log(`📌 Subject: ${options.subject}`);
    console.log(`📝 Content (Text preview):`);
    console.log(options.text || options.html.replace(/<[^>]*>?/gm, " ").slice(0, 300) + "...");
    console.log("=======================================================\n");

    return { success: true, messageId: `mock-${Date.now()}` };
  }

  /**
   * 1. Send Email Verification Code & Link
   */
  static async sendVerificationEmail({
    to,
    userName,
    code,
    verificationUrl,
  }: {
    to: string;
    userName: string;
    code: string;
    verificationUrl: string;
  }) {
    const subject = `Verify your email address - Shohoj Ledger`;
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fullUrl = verificationUrl.startsWith("http") ? verificationUrl : `${appUrl}${verificationUrl}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c182a; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .subtitle { font-size: 13px; color: #bae6fd; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 4px; }
          .body { padding: 32px 28px; line-height: 1.6; color: #cbd5e1; }
          .code-box { background: rgba(56, 189, 248, 0.1); border: 1px dashed #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, monospace; }
          .btn-wrapper { text-align: center; margin: 28px 0; }
          .button { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #06101e !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Shohoj Ledger</div>
            <div class="subtitle">Account Verification</div>
          </div>
          <div class="body">
            <h2 style="color: #ffffff; margin-top: 0;">Welcome, ${userName || "Valued User"}!</h2>
            <p>Thank you for signing up for Shohoj Ledger. Please verify your email address to activate your full enterprise workspace access.</p>
            
            <p>Your 6-digit verification code is:</p>
            <div class="code-box">
              <div class="otp-code">${code}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Valid for 24 hours</div>
            </div>

            <p style="text-align: center;">Or click the button below to verify automatically:</p>
            <div class="btn-wrapper">
              <a href="${fullUrl}" class="button">Verify Email Address</a>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">If you did not create an account with Shohoj Ledger, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Shohoj Ledger Enterprise Platform. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: `Welcome ${userName}! Your verification code is: ${code}. Or verify at: ${fullUrl}`,
    });
  }

  /**
   * 2. Send Password Reset OTP & Link
   */
  static async sendPasswordResetEmail({
    to,
    userName,
    code,
    resetUrl,
  }: {
    to: string;
    userName: string;
    code: string;
    resetUrl: string;
  }) {
    const subject = `Password Reset Request - Shohoj Ledger`;
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fullUrl = resetUrl.startsWith("http") ? resetUrl : `${appUrl}${resetUrl}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c182a; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .subtitle { font-size: 13px; color: #bae6fd; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 4px; }
          .body { padding: 32px 28px; line-height: 1.6; color: #cbd5e1; }
          .code-box { background: rgba(56, 189, 248, 0.1); border: 1px dashed #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, monospace; }
          .btn-wrapper { text-align: center; margin: 28px 0; }
          .button { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #06101e !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Shohoj Ledger</div>
            <div class="subtitle">Password Recovery</div>
          </div>
          <div class="body">
            <h2 style="color: #ffffff; margin-top: 0;">Hello ${userName || "there"},</h2>
            <p>We received a request to reset your password for your Shohoj Ledger account.</p>
            
            <p>Your 6-digit recovery OTP code is:</p>
            <div class="code-box">
              <div class="otp-code">${code}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Expires in 30 minutes</div>
            </div>

            <p style="text-align: center;">You can also click the secure button below to set a new password directly:</p>
            <div class="btn-wrapper">
              <a href="${fullUrl}" class="button">Reset Password Now</a>
            </div>

            <p style="font-size: 13px; color: #f87171;">⚠️ If you did not request a password reset, please ignore this email or contact your workspace administrator immediately.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Shohoj Ledger Enterprise Platform. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${userName}! Your password recovery code is: ${code}. Or reset at: ${fullUrl}`,
    });
  }

  /**
   * 3. Send Password Reset Confirmation Security Alert
   */
  static async sendPasswordResetConfirmationEmail({
    to,
    userName,
  }: {
    to: string;
    userName: string;
  }) {
    const subject = `Security Alert: Your Shohoj Ledger password was updated`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c182a; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
          .header { background: #10b981; padding: 24px; text-align: center; }
          .logo { font-size: 22px; font-weight: 800; color: #ffffff; }
          .body { padding: 28px; line-height: 1.6; color: #cbd5e1; }
          .footer { padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Shohoj Ledger · Security Alert</div>
          </div>
          <div class="body">
            <h3 style="color: #ffffff; margin-top: 0;">Password Successfully Changed</h3>
            <p>Hello ${userName || "there"},</p>
            <p>This is a confirmation that your account password has been successfully updated on <strong>${new Date().toUTCString()}</strong>.</p>
            <p>You can now sign in with your new password.</p>
            <p style="font-size: 13px; color: #f87171; margin-top: 20px;">If you did not perform this action, please contact your administrator immediately to secure your account.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Shohoj Ledger Enterprise Platform.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${userName}, your password was successfully changed on ${new Date().toUTCString()}.`,
    });
  }
}
