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
        versionCode: 38,
        versionName: '1.7.3-beta',
        channel: 'preview',
        minVersion: '1.0.0',
        title: 'Shohoj Staff v1.7.3 Beta — Calendar, Direct Fine Navigation & Streamlined Home',
        releaseNotes: [
          '⚡ Direct Fine Review: Tapping disciplinary fine banner now opens the Fines section immediately',
          '🧹 Clean Streamlined Home: Removed redundant duty schedule & metric cards for a distraction-free view',
          '📅 Horizontal Calendar: Smooth interactive date selector on attendance section',
          '💸 Date-wise Fines Grouping: Fines automatically grouped chronologically by date with daily totals and status badges',
          '🤝 Fines Consideration Request: Tap any fine to open an instant review request modal',
          '💬 Staff Task Comments: Staff can now directly add comments and status updates to assigned tasks',
          '🖼️ Real-Time Profile Photo Sync: Profile picture changes in ERP instantly reflect in the Staff app without re-logging in',
          '👤 High-Definition Profile Avatar: Redesigned Profile Screen header with smooth circular avatar & fallback initials',
          '🔝 Dynamic TopBar Avatar: Circular profile badge with tap-to-profile shortcut directly from TopBar',
          '🌙 Shohoj Dark Theme Preserved: Retained original Emerald & Slate brand identity and system bar colors'
        ],
        downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.3-beta.apk?v=38`,
        fileSize: '12.2 MB',
        isForceUpdate: false,
        publishedAt: new Date().toISOString()
      });
    }

    // Default Public Production Version (Shohoj Staff v1.7.3 Beta)
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 38,
      versionName: '1.7.3-beta',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.7.3 Beta Available',
      releaseNotes: [
        '⚡ Direct Fine Review: Tapping disciplinary fine banner now opens the Fines section immediately',
        '🧹 Clean Streamlined Home: Removed redundant duty schedule & metric cards for a distraction-free view',
        '📅 Horizontal Calendar: Smooth interactive date selector on attendance section',
        '💸 Date-wise Fines Grouping: Fines automatically grouped chronologically by date with daily totals and status badges',
        '🤝 Fines Consideration Request: Tap any fine to open an instant review request modal',
        '💬 Staff Task Comments: Staff can now directly add comments and status updates to assigned tasks',
        '🖼️ Real-Time Profile Photo Sync: Profile picture changes in ERP instantly reflect in the Staff app without re-logging in',
        '👤 High-Definition Profile Avatar: Redesigned Profile Screen header with smooth circular avatar & fallback initials',
        '🔝 Dynamic TopBar Avatar: Circular profile badge with tap-to-profile shortcut directly from TopBar',
        '🌙 Shohoj Dark Theme Preserved: Retained original Emerald & Slate brand identity and system bar colors'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.3-beta.apk?v=38`,
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
