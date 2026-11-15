/**
 * Shohoj Ledger - SMTP Diagnostics & Live Server Verification Utility
 * 
 * Usage on Live Server / Local:
 *   node scripts/test-smtp.js [recipient-email]
 * 
 * Example:
 *   node scripts/test-smtp.js shohojledger@gmail.com
 */

const dns = require("dns");
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

try {
  require("dotenv").config({ path: ".env.production" });
} catch {}
try {
  require("dotenv").config({ path: ".env.local" });
} catch {}
try {
  require("dotenv").config({ path: ".env" });
} catch {}

const nodemailer = require("nodemailer");

async function runDiagnostic() {
  console.log("\n=======================================================");
  console.log("       SHOHOJ LEDGER - SMTP LIVE SERVER DIAGNOSTIC");
  console.log("=======================================================\n");

  const host = process.env.SMTP_HOST || "";
  const service = process.env.SMTP_SERVICE || "";
  const port = process.env.SMTP_PORT || "465";
  const user = process.env.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || "";
  const cleanPass = rawPass.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM || `Shohoj Ledger Security <${user || "security@shohojsolution.com"}>`;
  const isGmail = host.toLowerCase().includes("gmail") || service.toLowerCase() === "gmail";

  console.log("1. Environment Variables Check:");
  console.log(`   - SMTP_HOST:    ${host ? host : "(NOT SET)"}`);
  console.log(`   - SMTP_SERVICE: ${service ? service : "(NOT SET)"}`);
  console.log(`   - SMTP_PORT:    ${port}`);
  console.log(`   - SMTP_USER:    ${user ? user : "❌ MISSING"}`);
  console.log(`   - SMTP_PASS:    ${cleanPass ? `SET (${cleanPass.length} chars, masked: ****${cleanPass.slice(-4)})` : "❌ MISSING"}`);
  console.log(`   - SMTP_FROM:    ${from}`);

  if (!user || !cleanPass) {
    console.error("\n❌ FAILED: Missing SMTP credentials in environment variables.");
    console.error("Please ensure SMTP_USER and SMTP_PASS are defined in your .env file or server environment variables.");
    console.log("=======================================================\n");
    process.exit(1);
  }

  console.log("\n2. Initializing Nodemailer Transporter...");
  const transportConfig = isGmail
    ? {
        service: "gmail",
        auth: { user: user.trim(), pass: cleanPass },
        tls: { rejectUnauthorized: false },
      }
    : service
    ? {
        service: service,
        auth: { user: user.trim(), pass: cleanPass },
        tls: { rejectUnauthorized: false },
      }
    : {
        host: host.trim(),
        port: Number(port) || 465,
        secure: process.env.SMTP_SECURE === "true" || port === "465",
        auth: { user: user.trim(), pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      };

  console.log(`   Transport Mode: ${isGmail ? "Gmail Native Service" : service || host + ":" + port}`);

  const transporter = nodemailer.createTransport(transportConfig);

  console.log("\n3. Verifying SMTP Socket Connection & Authentication...");
  try {
    await transporter.verify();
    console.log("   ✅ SUCCESS: SMTP server handshake and credentials verified!");
  } catch (err) {
    console.error("   ❌ SMTP Handshake FAILED with error:");
    console.error("   ", err.message || err);
    if (err.code === "EAUTH") {
      console.error("\n   💡 Tip: For Gmail, ensure 2-Step Verification is turned ON and generate a 16-character App Password at: https://myaccount.google.com/apppasswords");
    } else if (err.code === "ETIMEDOUT" || err.code === "EDNS") {
      console.error("\n   💡 Tip: Port or DNS timeout. Some cloud providers block outbound SMTP ports 25/465/587 by default. Ensure outbound connections are allowed.");
    }
    console.log("=======================================================\n");
    process.exit(1);
  }

  const targetRecipient = process.argv[2] || user;
  console.log(`\n4. Dispatching Test Email to: ${targetRecipient}...`);
  try {
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const info = await transporter.sendMail({
      from,
      to: targetRecipient,
      subject: `[Shohoj Ledger] Test Verification OTP: ${testCode}`,
      html: `
        <div style="font-family: sans-serif; background: #0c182a; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #38bdf8;">Shohoj Ledger Email System Test</h2>
          <p>This is a live test from your Shohoj Ledger production deployment.</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #38bdf8; padding: 12px; background: rgba(56,189,248,0.1); border-radius: 8px; text-align: center;">
            ${testCode}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Shohoj Ledger Email Test. Your verification code is: ${testCode}`,
    });

    console.log("   ✅ SUCCESS: Email dispatched successfully!");
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - Response:   ${info.response}`);
    console.log(`\n🎉 Verification email system is 100% operational on this server!`);
  } catch (sendErr) {
    console.error("   ❌ Failed to dispatch test email:");
    console.error("   ", sendErr.message || sendErr);
    process.exit(1);
  }

  console.log("=======================================================\n");
}

runDiagnostic();

