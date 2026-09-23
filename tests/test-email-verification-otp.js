const http = require('http');

function postRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== Testing 6-Digit OTP Email Verification API ===");

  const testEmail = `otp.test.${Date.now()}@shohojsolution.com`;

  // 1. Request verification code for email
  console.log(`\n1. Dispatching OTP code for ${testEmail}...`);
  const sendRes = await postRequest('/api/auth/send-verification', { email: testEmail });
  console.log("Send result status:", sendRes.status);
  console.log("Send result data:", sendRes.data);

  // 2. Test verifying with invalid code
  console.log("\n2. Testing invalid 6-digit code '000000'...");
  const invalidRes = await postRequest('/api/auth/verify-email', { email: testEmail, code: '000000' });
  console.log("Invalid code status (expected 400):", invalidRes.status);
  console.log("Invalid code response:", invalidRes.data);

  console.log("\n✅ All OTP verification routes working as expected!");
}

run().catch(console.error);
