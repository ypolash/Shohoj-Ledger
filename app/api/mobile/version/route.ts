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
    // Private / Internal Preview Channel
    if (isPreview) {
      return NextResponse.json({
        appName: 'Shohoj Staff (Beta Preview)',
        appId: 'com.shohoj.staff',
        versionCode: 41,
        versionName: '1.7.6-beta',
        channel: 'preview',
        minVersion: '1.0.0',
        title: 'Shohoj Staff v1.7.6 Beta — Absent Approval Data Sync & Enhancements',
        releaseNotes: [
          '🔄 Absent Approval Data Sync: Instant synchronization of HR absent approvals, regularizations, and fine waivers to mobile',
          '⏱️ Left-Side Chat Head Timer: Floating draggable countdown widget placed on the app left side across all screens',
          '📶 Enforced Office Wi-Fi Reconnect: Real-time Wi-Fi compliance checking requiring employees to reconnect to company Wi-Fi within break time to avoid fines',
          '🍽️ Custom Duty Break Sync: Break allowance and grace period dynamically match employee custom shift settings',
          '🛑 Timer Expiry Flow: Pause button auto-hides upon timer completion, transitioning cleanly to End Break'
        ],
        downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.6-beta.apk?v=41`,
        fileSize: '12.4 MB',
        isForceUpdate: false,
        publishedAt: new Date().toISOString()
      });
    }

    // Default Public Production Version (Shohoj Staff v1.7.6 Beta)
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 41,
      versionName: '1.7.6-beta',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.7.6 Beta Available',
      releaseNotes: [
        '🔄 Absent Approval Data Sync: Instant synchronization of HR absent approvals, regularizations, and fine waivers to mobile',
        '⏱️ Left-Side Chat Head Timer: Floating draggable countdown widget placed on the app left side across all screens',
        '📶 Enforced Office Wi-Fi Reconnect: Real-time Wi-Fi compliance checking requiring employees to reconnect to company Wi-Fi within break time to avoid fines',
        '🍽️ Custom Duty Break Sync: Break allowance and grace period dynamically match employee custom shift settings',
        '🛑 Timer Expiry Flow: Pause button auto-hides upon timer completion, transitioning cleanly to End Break'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.6-beta.apk?v=41`,
      fileSize: '12.4 MB',
      isForceUpdate: false,
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
