import { POST as SIGNUP } from "./app/api/auth/signup/route";
import { POST as LOGIN } from "./app/api/auth/login/route";

async function run() {
  console.log("--- SIGNUP ---");
  const signupReq = new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Test Company",
      ownerEmail: "testowner@shohoj.com",
      ownerPasswordRaw: "Password123!",
      ownerName: "Test Owner",
      businessType: "Product",
      selectedModules: ["finance"]
    })
  });
  const signupRes = await SIGNUP(signupReq);
  console.log(signupRes.status, await signupRes.text());

  console.log("--- LOGIN ---");
  const loginReq = new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "testowner@shohoj.com", password: "Password123!" })
  });
  const loginRes = await LOGIN(loginReq);
  console.log(loginRes.status, await loginRes.text());
}
run().catch(console.error);
