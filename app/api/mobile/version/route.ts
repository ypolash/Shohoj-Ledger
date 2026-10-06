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
      versionCode: 31,
      versionName: '1.6.6',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.6.6 Available',
      releaseNotes: [
        '⏸️ Break Timer Pause & Resume: Preserves exact remaining countdown without restarting from start',
        '📶 Wi-Fi Verification: Break actions and clock operations restricted to permitted office Wi-Fi',
        '⚡ Custom Duty Schedule Sync: Real-time sync and display of assigned custom duty shifts',
        '🗓️ Duty Roster Alerts: Instant notifications and schedule display for assigned duty dates',
        '🍽️ Dedicated Lunch Break section with live countdown & grace period penalty protection',
        '📦 Dedicated Product Management portal for assigned Product Managers & dynamic roles',
        '⚡ Real-time inventory tracking, studio receipts, & client dispatch workflows',
        '🚚 Instant Return Handover confirmation with courier tracking support',
        '👥 Full Directory listing & instant 1-on-1 private chat creation',
        '🔔 Instant real-time notifications for Tasks, Announcements, Rosters & Community Chat'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.6.6.apk`,
      fileSize: '12.8 MB',
      isForceUpdate: true,
      publishedAt: new Date().toISOString()
    });
  }

  // Fallback for general or other apps
  return NextResponse.json({
    appName: 'Shohoj Mobile',
    versionCode: 18,
    versionName: '1.6.6',
    title: 'Shohoj Mobile Update Available',
    releaseNotes: ['Custom duty sync, duty roster notifications, pause & resume lunch timer improvements'],
    downloadUrl: `${baseUrl}/downloads/shohoj-app-v1.6.6.apk`,
    isForceUpdate: false
  });
}
