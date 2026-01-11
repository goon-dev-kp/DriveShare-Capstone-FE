import type { Feature, LineString } from 'geojson'
// Utility for decoding encoded polyline strings into [lng, lat] coordinate arrays.
// Supports VietMap API polyline and falls back to mapbox/polyline.
// Encoded string is expected to be lat,lng order from most providers; we normalize to [lng, lat].

export interface DecodedRoute {
  coordinates: [number, number][]
  precision: number
}

export function decodePolyline(encoded: string, precision: number = 5): DecodedRoute {
  if (!encoded || typeof encoded !== 'string') return { coordinates: [], precision }
  let raw: number[][] = []
  try {
    // Prefer VietMap polyline implementation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Polyline } = require('@vietmap/vietmap-api')
    const pl = new Polyline()
    raw = pl.decode(encoded, precision)
  } catch (_e) {
    try {
      // Fallback to mapbox polyline lib (returns [lat, lng])
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mapbox = require('@mapbox/polyline')
      raw = mapbox.decode(encoded, precision)
    } catch (_e2) {
      return { coordinates: [], precision }
    }
  }
  // Normalise to [lng, lat]
  const coords: [number, number][] = raw.map(pair => [pair[1], pair[0]])
  return { coordinates: coords, precision }
}

export function toGeoJSONLineFeature(coordinates: [number, number][]): Feature<LineString> {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates
    }
  }
}
