import { prisma } from "@/lib/prisma";

export const OFFICE_LATITUDE = 23.8103;
export const OFFICE_LONGITUDE = 90.4125;
export const ALLOWED_RADIUS_METERS = 200000; // TEMPORARY TEST RADIUS

// Haversine formula to calculate the distance between two coordinates in meters
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function validateAttendanceRequest(
  latitude?: number,
  longitude?: number,
  wifiSsid?: string,
  wifiBssid?: string
): Promise<{ isValid: boolean; error?: string; details?: any }> {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return { isValid: false, error: "GPS disabled or location not provided." };
  }

  if (!wifiSsid || !wifiBssid) {
    return { isValid: false, error: "Wi-Fi information is missing." };
  }

  const allowedNetwork = await prisma.allowedNetwork.findFirst({
    where: { isActive: true },
  });

  if (!allowedNetwork) {
    return { isValid: false, error: "No active office Wi-Fi configured." };
  } else {
    console.log("Stored SSID:", allowedNetwork.ssid);
    console.log("Stored BSSID:", allowedNetwork.bssid);
    console.log("Detected SSID:", wifiSsid);
    console.log("Detected BSSID:", wifiBssid);

    const storedBssid = allowedNetwork.bssid || "";
    const incomingBssid = wifiBssid || "";
    const isMatch = incomingBssid.toLowerCase().trim() === storedBssid.toLowerCase().trim();

    if (!isMatch) {
      return { 
        isValid: false, 
        error: "Invalid network. Please connect to the office Wi-Fi.",
        details: {
          storedBssid,
          incomingBssid,
          storedSsid: allowedNetwork.ssid,
          detectedSsid: wifiSsid
        }
      };
    }
  }

  const distance = getDistanceInMeters(latitude, longitude, OFFICE_LATITUDE, OFFICE_LONGITUDE);

  if (distance > ALLOWED_RADIUS_METERS) {
    return { isValid: false, error: `Location outside radius. You are ${Math.round(distance)} meters away.` };
  }

  return { isValid: true };
}
