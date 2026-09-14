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

    // Generate clean unique filename
    const uniqueId = crypto.randomUUID();
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const extension = path.extname(cleanOriginalName);
    const fileName = `${uniqueId}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/community/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Community upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
