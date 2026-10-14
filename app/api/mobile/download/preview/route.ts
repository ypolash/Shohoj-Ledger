import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
  const targetPath = path.join(downloadsDir, 'shohoj-staff-v1.6.8.apk');

  if (!fs.existsSync(targetPath)) {
    return new NextResponse('Private preview APK (v1.6.8) not found on server.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const stat = fs.statSync(targetPath);
  const fileName = 'shohoj-staff-v1.6.8-preview.apk';
  const fileStream = fs.createReadStream(targetPath);

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
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
