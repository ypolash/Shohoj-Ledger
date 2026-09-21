import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".zip": "application/zip",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("File path required", { status: 400 });
    }

    // Sanitize path segments to prevent directory traversal
    const safeSegments = pathSegments.map((s) =>
      s.replace(/(\.\.[\/\\])+/g, "").replace(/[^a-zA-Z0-9_.-]/g, "_")
    );

    // Possible location candidates
    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", ...safeSegments),
      path.join(process.cwd(), "uploads", ...safeSegments),
      path.join(process.cwd(), ".next", "standalone", "public", "uploads", ...safeSegments),
    ];

    let targetFilePath: string | null = null;

    for (const p of possiblePaths) {
      try {
        const fileStat = await stat(p);
        if (fileStat.isFile()) {
          targetFilePath = p;
          break;
        }
      } catch {
        // Continue searching
      }
    }

    if (!targetFilePath) {
      return new NextResponse("File not found on server", { status: 404 });
    }

    const fileBuffer = await readFile(targetFilePath);
    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
