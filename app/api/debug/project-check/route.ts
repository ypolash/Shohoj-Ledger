import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * DEBUG ONLY — Remove after fixing the project-not-found issue.
 * Usage: GET /api/debug/project-check?id=<projectId>
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("id");

  const session = await getSession();
  const sessionCompanyId = session?.user?.companyId ?? null;
  const sessionRole = session?.user?.role ?? null;
  const sessionPlatformRole = session?.user?.platformRole ?? null;
  const sessionRoleId = session?.user?.roleId ?? null;

  if (!projectId) {
    return NextResponse.json({
      message: "Pass ?id=<projectId> to check a specific project",
      session: { companyId: sessionCompanyId, role: sessionRole, platformRole: sessionPlatformRole, roleId: sessionRoleId }
    });
  }

  // Bypass companyId filter — look up the raw project to see what company it belongs to
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, companyId: true, systemSource: true, name: true, status: true }
  });

  const companyMatch = project ? project.companyId === sessionCompanyId : false;

  return NextResponse.json({
    session: {
      companyId: sessionCompanyId,
      role: sessionRole,
      platformRole: sessionPlatformRole,
      roleId: sessionRoleId,
    },
    project: project ?? "NOT FOUND IN DB AT ALL",
    diagnosis: project
      ? companyMatch
        ? "✅ companyId MATCHES — the project should be visible. Check RBAC permissions."
        : `❌ companyId MISMATCH — session has [${sessionCompanyId}] but project belongs to [${project.companyId}]`
      : "❌ Project ID does not exist in the database at all.",
  });
}
