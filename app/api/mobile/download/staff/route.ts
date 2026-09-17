import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const versionedPath = path.join(process.cwd(), 'public', 'downloads', 'shohoj-staff-v1.5.8.apk');
  const latestPath = path.join(process.cwd(), 'public', 'downloads', 'shohoj-staff-latest.apk');
  const filePath = fs.existsSync(versionedPath) ? versionedPath : (fs.existsSync(latestPath) ? latestPath : path.join(process.cwd(), 'public', 'downloads', 'shohoj-staff-v1.5.apk'));

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Shohoj Staff APK not found on server.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

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
      'Content-Disposition': 'attachment; filename="shohoj-staff-v1.5.8.apk"',
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=86400, must-revalidate',
    },
  });
}
