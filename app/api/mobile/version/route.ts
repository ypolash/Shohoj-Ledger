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
        versionCode: 36,
        versionName: '1.7.1-beta',
        channel: 'preview',
        minVersion: '1.0.0',
        title: 'Shohoj Staff v1.7.1 Beta — Fines Consideration & Task Comments',
        releaseNotes: [
          '💸 Disciplinary Fines Hub: Quick Action tile & complete fines list with one-tap consideration request dialog',
          '💬 Staff Task Comments: Staff can now directly add comments and status updates to assigned tasks',
          '🖼️ Real-Time Profile Photo Sync: Profile picture changes in ERP instantly reflect in the Staff app without re-logging in',
          '👤 High-Definition Profile Avatar: Redesigned Profile Screen header with smooth circular avatar & fallback initials',
          '🔝 Dynamic TopBar Avatar: Circular profile badge with tap-to-profile shortcut directly from TopBar',
          '🎨 Nagad Item Inspiration: Refined tactile pill buttons (Clock In, Lunch Break, Clock Out) with smooth gradients and leading icons',
          '🔘 Modern Emblem Action Badges: Circular translucent emblem badges on all Quick Action tiles and stat metrics',
          '🏷️ Sleek Pill Status Chips: Redesigned status indicators (Clocked In, Late, Lunch Break, Duty Shift) as polished rounded pills',
          '🌙 Shohoj Dark Theme Preserved: Retained original Emerald & Slate brand identity and system bar colors',
          '⚠️ Disciplinary Fines Notification: Real-time high-priority alerts with sound and vibration when HR issues penalties',
          '🍽️ Dedicated Lunch Break section with live countdown & grace period penalty protection'
        ],
        downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.1-beta.apk?v=36`,
        fileSize: '12.2 MB',
        isForceUpdate: false,
        publishedAt: new Date().toISOString()
      });
    }

    // Default Public Production Version (Shohoj Staff v1.7.1 Beta)
    return NextResponse.json({
      appName: 'Shohoj Staff',
      appId: 'com.shohoj.staff',
      versionCode: 36,
      versionName: '1.7.1-beta',
      minVersion: '1.0.0',
      title: 'Shohoj Staff v1.7.1 Beta Available',
      releaseNotes: [
        '💸 Disciplinary Fines Hub: Quick Action tile & complete fines list with one-tap consideration request dialog',
        '💬 Staff Task Comments: Staff can now directly add comments and status updates to assigned tasks',
        '🖼️ Real-Time Profile Photo Sync: Profile picture changes in ERP instantly reflect in the Staff app without re-logging in',
        '👤 High-Definition Profile Avatar: Redesigned Profile Screen header with smooth circular avatar & fallback initials',
        '🔝 Dynamic TopBar Avatar: Circular profile badge with tap-to-profile shortcut directly from TopBar',
        '🎨 Nagad Item Inspiration: Refined tactile pill buttons (Clock In, Lunch Break, Clock Out) with smooth gradients and leading icons',
        '🔘 Modern Emblem Action Badges: Circular translucent emblem badges on all Quick Action tiles and stat metrics',
        '🏷️ Sleek Pill Status Chips: Redesigned status indicators (Clocked In, Late, Lunch Break, Duty Shift) as polished rounded pills',
        '🌙 Shohoj Dark Theme Preserved: Retained original Emerald & Slate brand identity and system bar colors',
        '⚠️ Disciplinary Fines Notification: Real-time high-priority alerts with sound and vibration when HR issues penalties',
        '🍽️ Dedicated Lunch Break section with live countdown & grace period penalty protection'
      ],
      downloadUrl: `${baseUrl}/downloads/shohoj-staff-v1.7.1-beta.apk?v=36`,
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
