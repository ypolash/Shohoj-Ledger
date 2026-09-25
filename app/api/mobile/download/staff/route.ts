import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedFile = searchParams.get('file') || searchParams.get('filename');
  const requestedVersion = searchParams.get('version') || searchParams.get('v');

  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');

  let targetPath: string | null = null;

  // 1. If explicit filename provided, check it first
  if (requestedFile) {
    const safeName = path.basename(requestedFile);
    const candidate = path.join(downloadsDir, safeName);
    if (fs.existsSync(candidate)) {
      targetPath = candidate;
    }
  }

  // 2. If explicit version provided (e.g., '1.5.8' or 'v1.5.8'), check it
  if (!targetPath && requestedVersion) {
    const cleanVersion = requestedVersion.replace(/^v/, '');
    const versionCandidate = path.join(downloadsDir, `shohoj-staff-v${cleanVersion}.apk`);
    if (fs.existsSync(versionCandidate)) {
      targetPath = versionCandidate;
    }
  }

  // 3. Fallback resolution cascade to newest available APK
  if (!targetPath) {
    const candidates = [
      path.join(downloadsDir, 'shohoj-staff-v1.6.0.apk'),
      path.join(downloadsDir, 'shohoj-staff-latest.apk'),
      path.join(downloadsDir, 'shohoj-staff-v1.5.9.apk'),
      path.join(downloadsDir, 'shohoj-staff-v1.5.8.apk'),
      path.join(downloadsDir, 'shohoj-staff-v1.5.7.apk'),
      path.join(downloadsDir, 'shohoj-staff-v1.5.apk'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        targetPath = candidate;
        break;
      }
    }
  }

  // 4. Dynamic discovery of any .apk in public/downloads if still not found
  if (!targetPath && fs.existsSync(downloadsDir)) {
    try {
      const files = fs.readdirSync(downloadsDir)
        .filter(f => f.endsWith('.apk') && f.startsWith('shohoj-staff'))
        .sort()
        .reverse();
      if (files.length > 0) {
        targetPath = path.join(downloadsDir, files[0]);
      }
    } catch {
      // ignore
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    return new NextResponse('Shohoj Staff APK not found on server.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const stat = fs.statSync(targetPath);
  const fileName = path.basename(targetPath);
  const fileStream = fs.createReadStream(targetPath);

  // Convert Node.js readable stream to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => controller.enqueue(chunk));
      fileStream.on('end', () => controller.close());
      fileStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=86400, must-revalidate',
    },
  });
}
