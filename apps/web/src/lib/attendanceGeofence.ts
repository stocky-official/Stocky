/**
 * Attendance Geofence Utility
 * Computes distance between user device GPS and branch location coordinates,
 * providing a 100-meter radius check for attendance clock-ins.
 */

/**
 * Calculates distance in meters between two latitude/longitude points using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface GeofenceCheckResult {
  allowed: boolean;
  distanceMeters?: number;
  message?: string;
  coords?: { latitude: number; longitude: number };
}

/**
 * Validates whether the user's current GPS position is within the specified radius (default: 100m)
 * of the branch location.
 *
 * Designed as a modular upgrade hook:
 * - `enforce = false`: Currently permissive for development & testing while gathering distance data.
 * - Set `enforce = true` to strictly block scanner opening unless user is within 100m radius.
 */
export async function checkBranchGeofence(
  targetLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    name?: string;
  } | null,
  maxRadiusMeters: number = 100,
  enforce: boolean = false
): Promise<GeofenceCheckResult> {
  if (!enforce) {
    return { allowed: true };
  }

  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      allowed: false,
      message: 'Geolocation is not supported by your browser or device.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!targetLocation?.latitude || !targetLocation?.longitude) {
          // If branch coordinates are not configured in system, permit clock-in
          return resolve({
            allowed: true,
            coords: { latitude, longitude },
          });
        }

        const distance = calculateDistanceMeters(
          latitude,
          longitude,
          targetLocation.latitude,
          targetLocation.longitude
        );

        const roundedDist = Math.round(distance);

        if (distance <= maxRadiusMeters) {
          resolve({
            allowed: true,
            distanceMeters: roundedDist,
            coords: { latitude, longitude },
          });
        } else {
          resolve({
            allowed: false,
            distanceMeters: roundedDist,
            coords: { latitude, longitude },
            message: `You are approximately ${roundedDist}m away from ${targetLocation.name || 'the branch'}. You must be within ${maxRadiusMeters}m to clock in.`,
          });
        }
      },
      (error) => {
        resolve({
          allowed: false,
          message: `Could not retrieve your location: ${error.message}. Please ensure location services are enabled.`,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  });
}
