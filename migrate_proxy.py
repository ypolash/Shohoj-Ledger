import os

with open("proxy_backup.ts", "r") as f:
    content = f.read()

# Add the super-admin check after the /dashboard check
super_admin_check = """
  if (pathname.startsWith('/super-admin')) {
    const session = await getSession();
    if (!session) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else if (session.user.platformRole !== 'SUPER_ADMIN') {
      response = NextResponse.redirect(new URL('/erp', request.url));
    }
  }
"""

content = content.replace("  // 1. Enforce Security Headers", super_admin_check + "\n  // 1. Enforce Security Headers")

with open("proxy.ts", "w") as f:
    f.write(content)

if os.path.exists("middleware.ts"):
    os.remove("middleware.ts")
if os.path.exists("proxy_backup.ts"):
    os.remove("proxy_backup.ts")
