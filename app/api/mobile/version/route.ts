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
      versionCode: 29,
      versionName: '1.6.4',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.6.4 Available',
      releaseNotes: [
        '📦 Dedicated Product Management portal for assigned Product Managers',
        '⚡ Real-time inventory tracking, studio receipts, & client dispatch workflows',
        '🚚 Instant Return Handover confirmation with courier tracking support',
        '👥 Full Directory listing & instant 1-on-1 private chat creation',
        '✨ Top bar status bar safe-area padding & safe insets on all devices',
        '⚡ Redesigned Community tabs with live unread indicators & directory counters',
        '☕ Dynamic Lunch Break on Check-In with 15-minute prior availability & live countdown',
        '🖼️ Fullscreen image viewer and attachment uploads in Community Chat',
        '🔔 Instant real-time notifications for Tasks, Announcements & Community Chat'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.6.4.apk`,
      fileSize: '12.8 MB',
      isForceUpdate: false,
      publishedAt: new Date().toISOString()
    });
  }

  // Fallback for general or other apps
  return NextResponse.json({
    appName: 'Shohoj Mobile',
    versionCode: 16,
    versionName: '1.6.4',
    title: 'Shohoj Mobile Update Available',
    releaseNotes: ['General bug fixes and performance improvements'],
    downloadUrl: `${baseUrl}/downloads/shohoj-app-v1.6.4.apk`,
    isForceUpdate: false
  });
}
