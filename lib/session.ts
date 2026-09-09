import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey || "development_secret_only");

function ensureSecretKey() {
  if (!secretKey && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is missing in production!");
  }
}

export async function encrypt(payload: any, expiresIn: string = "30d") {
  ensureSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  ensureSecretKey();
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(user: any, days: number = 30) {
  // Create the session (default 30 days for mobile compatibility)
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires }, `${days}d`);

  // Save the session in a cookie
  try {
    (await cookies()).set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  } catch (e) {
    // cookies() might not be mutable in some execution contexts
  }

  return session;
}

export async function getSession() {
  try {
    let session = (await cookies()).get("session")?.value;

    // If no cookie, attempt to read Authorization: Bearer <token>
    if (!session) {
      try {
        const headerList = await headers();
        const authHeader = headerList.get("authorization") || headerList.get("Authorization");
        if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
          session = authHeader.slice(7).trim();
        }
      } catch (hErr) {
        // Headers might not be available in all contexts
      }
    }

    if (!session) return null;
    return await decrypt(session);
  } catch (e) {
    return null;
  }
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session!);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
