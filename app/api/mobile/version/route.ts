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
      versionCode: 25,
      versionName: '1.6.0',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.6.0 Available',
      releaseNotes: [
        '☕ Dynamic Lunch Break on Check-In with 15-minute prior availability & live countdown',
        '🖼️ Fullscreen image viewer and attachment uploads in Community Chat',
        '⚡ Unrestricted background running & battery optimization exemption support',
        '🔔 Instant real-time notifications for Tasks, Announcements & Community Chat',
        '⏰ Exact alarm wakeups & persistent 24/7 background sync service',
        '🚀 Xiaomi, Samsung, Vivo, OPPO, Realme autostart support & setup guide',
        '🧪 In-app test notification & background diagnostics'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.6.0.apk`,
      fileSize: '12.6 MB',
      isForceUpdate: false,
      publishedAt: '2026-09-24T01:40:00Z'
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
