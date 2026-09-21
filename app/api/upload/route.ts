import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check size limit: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const originalName = (file.name || "file").replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(originalName).toLowerCase();

    // Map common extensions to mime types
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
      ? file.type
      : (mimeMap[extension] || "application/octet-stream");

    // Allowed if type is recognized image, document, or has valid extension
    const isImage = inferredType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"].includes(extension);
    const isDoc = inferredType.startsWith("application/") || inferredType.startsWith("text/") || [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"].includes(extension);

    if (!isImage && !isDoc) {
      return NextResponse.json({ error: "Invalid file type. Only Images, PDFs, and Documents are allowed." }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with normalized lowercase extension
    const uniqueId = crypto.randomUUID();
    const finalExt = extension || (isImage ? ".jpg" : ".bin");
    const fileName = `${uniqueId}${finalExt}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl, 
      name: file.name, 
      type: inferredType,
      size: file.size
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
