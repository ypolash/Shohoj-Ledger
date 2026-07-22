import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_BACKUPS");
    if (rbacGuard) return rbacGuard;

    const backups = await prisma.systemBackup.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convert BigInt to string for JSON serialization
    const serializedBackups = backups.map((b: any) => ({
      ...b,
      fileSize: b.fileSize ? b.fileSize.toString() : null
    }));

    return NextResponse.json({ backups: serializedBackups });
  } catch (error) {
    console.error("GET System Backups Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_BACKUPS");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const userId = session?.user?.id;

    // Simulate backup triggering
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql.gz`;

    const backup = await prisma.systemBackup.create({
      data: {
        fileName: backupName,
        status: "PENDING",
        triggeredBy: userId || "SYSTEM"
      }
    });

    // Simulate a long running backup process asynchronously
    setTimeout(async () => {
      try {
        await prisma.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: "SUCCESS",
            fileSize: BigInt(Math.floor(Math.random() * 500000000) + 100000000), // Random size 100MB - 600MB
            completedAt: new Date()
          }
        });
      } catch (err) {
        console.error("Failed to complete backup simulation", err);
      }
    }, 5000); // 5 second simulation

    return NextResponse.json({ backup: { ...backup, fileSize: null } });
  } catch (error) {
    console.error("POST System Backups Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
