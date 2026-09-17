import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      versionCode: 22,
      versionName: '1.5.7',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.5.7 Available',
      releaseNotes: [
        '⚡ Instant Auto-Approved Short Breaks (no HR approval wait)',
        '⏱️ Pre-request warning banner with duration & overstay fine limits',
        '☕ Real-time live countdown timer & 1-tap End Break on Home and Leave screens',
        '🔔 Background notification sync for Tasks, Notices & Community Chat',
        '🔧 Resolved overstay fine persistence settings'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.5.7.apk`,
      fileSize: '18.7 MB',
      isForceUpdate: false,
      publishedAt: '2026-09-18T01:00:00Z'
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
