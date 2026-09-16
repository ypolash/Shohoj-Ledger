import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app') || 'staff';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const rawHost = request.headers.get('host') || 'localhost:3000';
  const host = forwardedHost || rawHost;
  const protocol = forwardedProto || (host.includes('localhost') || host.includes('10.0.2.2') || host.includes('127.0.0.1') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  if (app === 'staff') {
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 19,
      versionName: '1.5.4',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.5.4 Available',
      releaseNotes: [
        '📋 Interactive To-Do Checklists under task cards',
        '✅ Real-time checkbox toggling and progress bar',
        '⚡ Performance and background sync improvements'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.5.4.apk`,
      fileSize: '18.2 MB',
      isForceUpdate: false,
      publishedAt: '2026-09-16T00:00:00Z'
    });
  }

  // Fallback for general or other apps
  return NextResponse.json({
    appName: 'Shohoj Mobile',
    versionCode: 15,
    versionName: '1.5.0',
    title: 'Shohoj Mobile Update Available',
    releaseNotes: ['General bug fixes and performance improvements'],
    downloadUrl: `${baseUrl}/downloads/shohoj-app-v1.5.apk`,
    isForceUpdate: false
  });
}
