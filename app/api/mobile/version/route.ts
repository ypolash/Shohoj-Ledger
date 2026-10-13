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
      versionCode: 33,
      versionName: '1.6.8',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.6.8 — Nagad Redesign Available',
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
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.6.8.apk`,
      fileSize: '12.9 MB',
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
