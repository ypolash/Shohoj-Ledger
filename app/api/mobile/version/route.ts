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
        versionCode: 39,
        versionName: '1.7.4-beta',
        channel: 'preview',
        minVersion: '1.0.0',
        title: 'Shohoj Staff v1.7.4 Beta — Vertical Attendance History & Enhanced Break Policy',
        releaseNotes: [
          '📊 Vertical Attendance History: Redesigned attendance cards into sleek vertical mode with Check In, Check Out, Lunch Break times, Late Time, and Work Duration',
          '🍽️ Lunch Break Telemetry: Attendance history now displays lunch break start/end intervals and taken duration',
          '⏱️ Punctuality Indicator: Dedicated Late Time metric with instant on-time and late penalty visibility',
          '🔒 Enforced Break Policy: Strict company Wi-Fi network and GPS location validation for all lunch & break requests',
          '✨ Modern Resume Button: Refined button styling with glowing emerald borders and non-wrapping typography',
          '📆 Synchronized Calendar: Horizontal attendance calendar defaults and auto-scrolls to today',
          '💬 Community Tabs UI: Redesigned segmented pill tab container with subtle glowing indicators'
        ],
        downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.4-beta.apk?v=39`,
        fileSize: '12.2 MB',
        isForceUpdate: false,
        publishedAt: new Date().toISOString()
      });
    }

    // Default Public Production Version (Shohoj Staff v1.7.4 Beta)
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 39,
      versionName: '1.7.4-beta',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.7.4 Beta Available',
      releaseNotes: [
        '📊 Vertical Attendance History: Redesigned attendance cards into sleek vertical mode with Check In, Check Out, Lunch Break times, Late Time, and Work Duration',
        '🍽️ Lunch Break Telemetry: Attendance history now displays lunch break start/end intervals and taken duration',
        '⏱️ Punctuality Indicator: Dedicated Late Time metric with instant on-time and late penalty visibility',
        '🔒 Enforced Break Policy: Strict company Wi-Fi network and GPS location validation for all lunch & break requests',
        '✨ Modern Resume Button: Refined button styling with glowing emerald borders and non-wrapping typography',
        '📆 Synchronized Calendar: Horizontal attendance calendar defaults and auto-scrolls to today',
        '💬 Community Tabs UI: Redesigned segmented pill tab container with subtle glowing indicators'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.4-beta.apk?v=39`,
      fileSize: '12.2 MB',
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
