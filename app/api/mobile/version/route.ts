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

  const channel = searchParams.get('channel')?.toLowerCase();
  const isPreview = searchParams.get('preview') === 'true' || 
                    channel === 'preview' || 
                    channel === 'internal' || 
                    channel === 'beta' || 
                    channel === 'private';

  if (app === 'staff') {
    // Private / Internal Preview Channel for testing the new Nagad UI build
    if (isPreview) {
      return NextResponse.json({
        appName: 'Shohoj Staff (Private Preview)',
        appId: 'com.shohoj.staff',
        versionCode: 33,
        versionName: '1.6.8',
        channel: 'preview',
        minVersion: '1.0.0',
        title: 'Shohoj Staff v1.6.8 (Private Preview) — Nagad Redesign',
        releaseNotes: [
          '✨ All-New Nagad Redesign: Immersive scenic watercolor banner, warm cream-to-white backdrop, coral-red accents & elevated card layout',
          '💰 Tap for Balance Widget: Interactive pill capsule revealing employee net salary with smooth animation & auto-hide timer',
          '⚡ Raised Floating Action Button (FAB): One-tap instant attendance punch & QR validation centered in elevated bottom navigation',
          '📱 4x2 Nagad Action Grid: Quick access to Attendance, Leave Apply, Tasks, Payslip & Fines, Duty Shift, Break/Lunch, Notices & Staff Forum',
          '📢 Promotional Carousel Banner: Dynamic notice & incentive announcements with dot indicators',
          '⚠️ Disciplinary Fines Notification: Real-time high-priority alerts with sound and vibration when HR issues penalties',
          '🔗 Clickable Task URLs: Open external websites and checklists directly in browser with 1-tap launcher',
          '🍽️ Dedicated Lunch Break section with live countdown & grace period penalty protection',
          '📦 Dedicated Product Management portal for assigned Product Managers'
        ],
        downloadUrl: `${baseUrl}/api/mobile/download/staff?version=1.6.8`,
        fileSize: '13.1 MB',
        isForceUpdate: false,
        publishedAt: new Date().toISOString()
      });
    }

    // Default Public Production Version (Safe v1.6.7 stable release)
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 32,
      versionName: '1.6.7',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.6.7 Available',
      releaseNotes: [
        '⚠️ Disciplinary Fines Notification: Real-time high-priority alerts with sound and vibration when HR issues penalties',
        '🔗 Clickable Task URLs: Open external websites and checklists directly in browser with 1-tap launcher',
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
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.6.7.apk`,
      fileSize: '12.8 MB',
      isForceUpdate: true,
      publishedAt: '2026-10-14T01:36:59.000Z'
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
