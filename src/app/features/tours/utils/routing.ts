export const ACTIVITY_SPEEDS: Record<string, number> = {
  walking: 4,
  running: 10,
  cycling: 15,
};

/**
 * Calculate tour duration in minutes
 * paceLevel: -1 = gemütlich (+25 %), 0 = normal, 1 = motiviert (−25 %)
 */
export function calcDurationMin(
  distKm: number,
  transportType: string,
  paceLevel: number,
): number {
  const speed = ACTIVITY_SPEEDS[transportType] ?? 4;
  const mult  = paceLevel === -1 ? 1.25 : paceLevel === 1 ? 0.75 : 1.0;
  return Math.round((distKm / speed) * 60 * mult);
}

export interface RouteResult {
  distanceM: number;              // total route distance in metres
  durationS: number;              // total route duration in seconds
  latLngs: [number, number][];    // [lat, lon] pairs ready for Leaflet
  profile: string;
}

export function routingProfile(activity: string, accessible = false): string {
  if (accessible) return 'foot';
  if (activity === 'cycling') return 'bike';
  return 'foot';
}

/**
 * Fetch a route from the public OSRM demo server. The public server may not
 * expose every profile everywhere, so callers should still keep a fallback.
 */
export async function fetchOsrmRoute(
  points: Array<{ latitude: number; longitude: number }>,
  activity = 'walking',
  accessible = false,
): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  const profile = routingProfile(activity, accessible);
  const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${coords}` +
      `?overview=full&geometries=geojson`,
    );
    if (!res.ok) {
      console.error(`OSRM: HTTP ${res.status} für Profil "${profile}"`);
      return null;
    }
    const data = await res.json();
    if (data.code !== 'Ok') {
      console.error(`OSRM: Code "${data.code}" – keine Route gefunden`);
      return null;
    }
    const r = data.routes?.[0];
    if (!r) {
      console.error('OSRM: Antwort enthält keine Routen');
      return null;
    }
    if (!Array.isArray(r.geometry?.coordinates)) {
      console.error('OSRM: Ungültige Geometrie in der Antwort');
      return null;
    }
    return {
      distanceM: r.distance,
      durationS: r.duration,
      latLngs: (r.geometry.coordinates as number[][]).map(
        ([lon, lat]) => [lat, lon] as [number, number],
      ),
      profile,
    };
  } catch (e) {
    console.error('OSRM: Netzwerkfehler beim Routing', e);
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
