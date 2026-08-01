import { POST } from "./app/api/auth/login/route";

async function testLogin() {
  const req = new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "erp-admin@shohoj.com", password: "password" })
  });
  
  const res = await POST(req);
  console.log(res.status, await res.json());
}
testLogin().catch(console.error);
