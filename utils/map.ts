// Generic reusable map spatial helpers.
import type { Position } from 'geojson'

export interface Bounds {
  sw: Position
  ne: Position
}

export function computeBounds(coords: Position[]): Bounds | null {
  if (!coords || !coords.length) return null
  let minLng = coords[0][0]
  let maxLng = coords[0][0]
  let minLat = coords[0][1]
  let maxLat = coords[0][1]
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return { sw: [minLng, minLat], ne: [maxLng, maxLat] }
}

export function centerOfBounds(b: Bounds | null): Position | null {
  if (!b) return null
  return [(b.sw[0] + b.ne[0]) / 2, (b.sw[1] + b.ne[1]) / 2]
}

export function ensureMinPadding(padding?: { top?: number; bottom?: number; left?: number; right?: number }, min = 24) {
  if (!padding) {
    return { top: min, bottom: min, left: min, right: min }
  }
  return {
    top: Math.max(min, padding.top ?? 0),
    bottom: Math.max(min, padding.bottom ?? 0),
    left: Math.max(min, padding.left ?? 0),
    right: Math.max(min, padding.right ?? 0)
  }
}
