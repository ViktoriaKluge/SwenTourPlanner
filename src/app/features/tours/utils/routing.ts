/** Standardized activity speeds (km/h) based on common fitness references */
export const ACTIVITY_SPEEDS: Record<string, number> = {
  hike: 4,   // avg. hiking pace (DIN 33466 guideline: ~4 km/h on moderate terrain)
  run:  10,  // recreational running (~6 min/km)
  bike: 15,  // leisure cycling (EuroVelo standard: 15 km/h average)
};

/**
 * Calculate tour duration in minutes.
 * paceLevel: -1 = gemütlich (+25 %), 0 = normal, 1 = motiviert (−25 %)
 */
export function calcDurationMin(
  distKm: number,
  category: string,
  paceLevel: number,
): number {
  const speed = ACTIVITY_SPEEDS[category] ?? 4;
  const mult  = paceLevel === -1 ? 1.25 : paceLevel === 1 ? 0.75 : 1.0;
  return Math.round((distKm / speed) * 60 * mult);
}

export interface RouteResult {
  distanceM: number;              // total route distance in metres
  latLngs: [number, number][];    // [lat, lon] pairs ready for Leaflet
}

/**
 * Fetch a driving route from the public OSRM demo server.
 * Points must all have valid coordinates.
 */
export async function fetchOsrmRoute(
  points: Array<{ latitude: number; longitude: number }>,
): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const r = data.routes[0];
    return {
      distanceM: r.distance,
      latLngs: (r.geometry.coordinates as number[][]).map(
        ([lon, lat]) => [lat, lon] as [number, number],
      ),
    };
  } catch {
    return null;
  }
}

/** Guard: returns true only for geographically valid coordinates */
export function isValidCoord(p: { latitude: unknown; longitude: unknown } | null | undefined): boolean {
  return (
    !!p &&
    typeof p.latitude  === 'number' && typeof p.longitude === 'number' &&
    p.latitude  >= -90  && p.latitude  <= 90 &&
    p.longitude >= -180 && p.longitude <= 180
  );
}
