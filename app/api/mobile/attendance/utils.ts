export const ALLOWED_WIFI_SSIDS = ["SHOHOJ-OFFICE"];
export const ALLOWED_WIFI_BSSIDS = ["3C:84:6A:11:22:33"];
export const OFFICE_LATITUDE = 23.8103;
export const OFFICE_LONGITUDE = 90.4125;
export const ALLOWED_RADIUS_METERS = 100;

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

export function validateAttendanceRequest(
  latitude?: number,
  longitude?: number,
  wifiSsid?: string,
  wifiBssid?: string
): { isValid: boolean; error?: string } {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return { isValid: false, error: "GPS disabled or location not provided." };
  }

  if (!wifiSsid || !wifiBssid) {
    return { isValid: false, error: "Wi-Fi information is missing." };
  }

  if (!ALLOWED_WIFI_SSIDS.includes(wifiSsid) || !ALLOWED_WIFI_BSSIDS.includes(wifiBssid)) {
    return { isValid: false, error: "Invalid network. Please connect to the office Wi-Fi." };
  }

  const distance = getDistanceInMeters(latitude, longitude, OFFICE_LATITUDE, OFFICE_LONGITUDE);

  if (distance > ALLOWED_RADIUS_METERS) {
    return { isValid: false, error: `Location outside radius. You are ${Math.round(distance)} meters away.` };
  }

  return { isValid: true };
}
