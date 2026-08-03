import { prisma } from "@/lib/prisma";

export const OFFICE_LATITUDE = 23.8103;
export const OFFICE_LONGITUDE = 90.4125;
export const ALLOWED_RADIUS_METERS = 200000; // TEMPORARY TEST RADIUS

export async function getAttendanceConfig() {
  let config = await prisma.attendanceConfig.findFirst();
  if (!config) {
    config = await prisma.attendanceConfig.create({
      data: {}
    });
  }
  return config;
}

export async function calculatePunishment(type: string, minutes: number): Promise<number> {
  const rules = await prisma.punishmentSetting.findMany({
    where: { type, active: true }
  });
  
  for (const rule of rules) {
    if (minutes >= rule.fromMinutes && minutes <= rule.toMinutes) {
      return Number(rule.amount);
    }
  }
  return 0;
}

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
  companyId: string,
  latitude?: number,
  longitude?: number,
  wifiSsid?: string,
  wifiBssid?: string
): Promise<{ isValid: boolean; error?: string; details?: any }> {
  if (!companyId) {
    return { isValid: false, error: "Company ID is missing for validation." };
  }

  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return { isValid: false, error: "GPS disabled or location not provided." };
  }

  if (!wifiSsid || !wifiBssid) {
    return { isValid: false, error: "Wi-Fi information is missing." };
  }

  const allowedNetworks = await prisma.allowedNetwork.findMany({
    where: { companyId, isActive: true },
  });

  try {
    await prisma.globalAuditLog.create({
      data: {
        companyId,
        module: "ATTENDANCE_DEBUG",
        entityType: "NETWORK_VALIDATION_START",
        entityId: "debug",
        action: "CHECKIN_ATTEMPT",
        description: `Networks found: ${allowedNetworks.length}. Phone BSSID: ${wifiBssid}, SSID: ${wifiSsid}`,
      }
    });
  } catch(e) {}

  if (!allowedNetworks || allowedNetworks.length === 0) {
    return { isValid: false, error: "No active office Wi-Fi configured." };
  } else {
    const incomingBssid = (wifiBssid || "").toLowerCase().trim();
    const incomingSsid = (wifiSsid || "").trim();
    
    let isMatch = false;
    let storedBssid = "";
    
    for (const net of allowedNetworks) {
      storedBssid = (net.bssid || "").toLowerCase().trim();
      if (incomingBssid === storedBssid) {
        isMatch = true;
        break;
      }
    }

    if (!isMatch) {
      const storedBssidsList = allowedNetworks.map(n => n.bssid).join(", ");
      const diagMessage = `Network mismatch. Phone sent MAC (BSSID): "${incomingBssid}". Allowed MACs: "${storedBssidsList}".`;
      
      try {
        await prisma.globalAuditLog.create({
          data: {
            companyId,
            module: "ATTENDANCE_DEBUG",
            entityType: "NETWORK_VALIDATION",
            entityId: "debug",
            action: "FAILED_CHECKIN",
            description: diagMessage,
          }
        });
      } catch (e) {
        console.error("Failed to write audit log", e);
      }

      return { 
        isValid: false, 
        error: diagMessage + " Please check if you are connected to 2.4GHz/5GHz or if MAC randomization is on.",
        details: {
          incomingBssid,
          detectedSsid: incomingSsid,
          allowedCount: allowedNetworks.length
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
