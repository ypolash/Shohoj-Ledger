import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Size limit: 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 25MB limit" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "community");
    await mkdir(uploadDir, { recursive: true });

    // Clean name and lowercase extension
    const cleanOriginalName = (file.name || "file").replace(/[^a-zA-Z0-9.-]/g, "_");
    const rawExt = path.extname(cleanOriginalName);
    const extension = rawExt ? rawExt.toLowerCase() : "";

    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".bmp": "image/bmp",
      ".ico": "image/x-icon",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };

    const inferredType = (file.type && file.type !== "application/octet-stream")
      ? (file.type === "image/jpg" ? "image/jpeg" : file.type)
      : (mimeMap[extension] || "application/octet-stream");

    // Generate clean unique filename
    const uniqueId = crypto.randomUUID();
    const finalExt = extension || (inferredType.startsWith("image/") ? ".jpg" : "");
    const fileName = `${uniqueId}${finalExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/community/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: inferredType,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Community upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
