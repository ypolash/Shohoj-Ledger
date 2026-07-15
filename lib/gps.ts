// Default Office Coordinates (e.g. Dhaka, Bangladesh)
// In a real app, you might fetch this from the database (Settings model).
export const OFFICE_LAT = 23.8103;
export const OFFICE_LNG = 90.4125;
export const MAX_RADIUS_METERS = 100; // 100 meters default

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Validates if the given coordinates are within the office radius.
 */
export function isWithinOfficeRadius(lat: number, lng: number): boolean {
  const distance = getDistanceInMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);
  return distance <= MAX_RADIUS_METERS;
}
