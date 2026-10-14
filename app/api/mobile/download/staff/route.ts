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

  // 2. If explicit version provided (e.g., '1.6.5' or 'v1.6.5'), check it
  if (!targetPath && requestedVersion) {
    const cleanVersion = requestedVersion.replace(/^v/, '');
    const versionCandidate = path.join(downloadsDir, `shohoj-staff-v${cleanVersion}.apk`);
    if (fs.existsSync(versionCandidate)) {
      targetPath = versionCandidate;
    }
  }

  const channel = searchParams.get('channel')?.toLowerCase();
  const isPreview = searchParams.get('preview') === 'true' || 
                    channel === 'preview' || 
                    channel === 'internal' || 
                    channel === 'beta' || 
                    channel === 'private';

  // 3. If preview/private channel requested, serve v1.6.8
  if (!targetPath && isPreview) {
    const previewCandidate = path.join(downloadsDir, 'shohoj-staff-v1.6.8.apk');
    if (fs.existsSync(previewCandidate)) {
      targetPath = previewCandidate;
    }
  }

  // 4. Fallback resolution cascade to public stable APK (v1.6.7)
  if (!targetPath) {
    const publicCandidates = [
      path.join(downloadsDir, 'shohoj-staff-v1.6.7.apk'),
      path.join(downloadsDir, 'shohoj-staff-latest.apk'),
    ];

    for (const candidate of publicCandidates) {
      if (fs.existsSync(candidate)) {
        targetPath = candidate;
        break;
      }
    }
  }

  // 5. Dynamic discovery of any .apk in public/downloads if still not found
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
