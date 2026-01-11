import type { Position } from 'geojson'
import { decodePolyline } from './polyline'

export type RouteLike = any

export interface RouteStepEntry {
  startIndex: number
  endIndex?: number
  text: string
}

export const haversine = (a: Position, b: Position): number => {
  // Validate inputs
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b)) {
    console.warn('haversine: Invalid input parameters', { a, b })
    return 0
  }
  
  if (a.length < 2 || b.length < 2) {
    console.warn('haversine: Position arrays must have at least 2 elements', { a, b })
    return 0
  }
  
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const getStepText = (step: any): string =>
  step?.maneuver?.instruction || step?.instruction || step?.name || step?.maneuver?.type || 'Tiếp tục theo tuyến đường'

const extractFromRouteLike = (routeData: RouteLike): { coords: Position[]; steps: RouteStepEntry[] } => {
  const coords: Position[] = []
  const steps: RouteStepEntry[] = []
  if (!routeData) return { coords, steps }

  // GeoJSON Feature with LineString
  if (routeData.type === 'Feature' && routeData.geometry?.type === 'LineString') {
    const c = Array.isArray(routeData.geometry.coordinates) ? (routeData.geometry.coordinates as Position[]) : []
    return { coords: c.slice(), steps }
  }
  // FeatureCollection pick first LineString
  if (routeData.type === 'FeatureCollection' && Array.isArray(routeData.features)) {
    const line = routeData.features.find((f: any) => f?.geometry?.type === 'LineString')
    if (line?.geometry?.coordinates) return { coords: (line.geometry.coordinates as Position[]).slice(), steps }
  }

  const route = (routeData as any).routes?.[0] ?? (routeData as any).route ?? routeData
  if (route?.legs?.length) {
    for (const leg of route.legs) {
      if (leg.steps?.length) {
        for (const step of leg.steps) {
          const c: Position[] | undefined = step?.geometry?.coordinates
          if (c?.length) {
            const startIndex = coords.length
            steps.push({ startIndex, text: getStepText(step) })
            if (coords.length && coords[coords.length - 1][0] === c[0][0] && coords[coords.length - 1][1] === c[0][1]) {
              coords.push(...c.slice(1))
            } else {
              coords.push(...c)
            }
          }
        }
      } else if (leg.geometry?.coordinates?.length) {
        coords.push(...(leg.geometry.coordinates as Position[]))
      }
    }
    return { coords, steps }
  }

  if ((routeData as any).geometry?.type === 'LineString' && Array.isArray((routeData as any).geometry.coordinates)) {
    return { coords: ((routeData as any).geometry.coordinates as Position[]).slice(), steps }
  }

  return { coords, steps }
}

export const extractRouteWithSteps = (routeData?: RouteLike | string | null): { coords: Position[]; steps: RouteStepEntry[] } => {
  if (!routeData) return { coords: [], steps: [] }
  if (typeof routeData === 'string') {
    try {
      const { coordinates } = decodePolyline(routeData, 5)
      // Synthetic steps every ~300m or 25 points
      const steps: RouteStepEntry[] = []
      let lastIdx = 0
      let acc = 0
      for (let i = 1; i < coordinates.length; i++) {
        acc += haversine(coordinates[i - 1], coordinates[i])
        if (acc >= 300 || i - lastIdx >= 25) {
          steps.push({ startIndex: lastIdx, endIndex: i, text: 'Tiếp tục theo tuyến đường' })
          lastIdx = i
          acc = 0
        }
      }
      if (coordinates.length > 1) steps.push({ startIndex: lastIdx, endIndex: coordinates.length - 1, text: 'Đến điểm đến' })
      return { coords: coordinates, steps }
    } catch {
      // Try parse JSON-like string
      try {
        const obj = JSON.parse(routeData)
        return extractFromRouteLike(obj)
      } catch {
        return { coords: [], steps: [] }
      }
    }
  }
  return extractFromRouteLike(routeData as RouteLike)
}

export const nearestCoordIndex = (pos: Position, coords: Position[]) => {
  if (!coords || !coords.length) return { index: 0, distance: Infinity }
  let minD = Infinity
  let minI = 0
  for (let i = 0; i < coords.length; i++) {
    const d = haversine(pos, coords[i])
    if (d < minD) { minD = d; minI = i }
  }
  return { index: minI, distance: minD }
}

export const remainingDistanceFrom = (index: number, coords: Position[], from?: Position | null) => {
  if (!coords || coords.length === 0) return 0
  let dist = 0
  const i = Math.max(0, Math.min(index, coords.length - 1))
  if (from && coords[i]) dist += haversine(from, coords[i])
  for (let j = i; j < coords.length - 1; j++) dist += haversine(coords[j], coords[j + 1])
  return dist
}

export const formatMeters = (m: number) => {
  if (!isFinite(m) || m <= 0) return '0 m'
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`
}

export const buildGoogleMapsLink = (origin?: Position | null, dest?: Position | null) => {
  const params = new URLSearchParams()
  if (origin) params.set('origin', `${origin[1]},${origin[0]}`)
  if (dest) params.set('destination', `${dest[1]},${dest[0]}`)
  params.set('travelmode', 'driving')
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`
}

export const buildAppleMapsLink = (origin?: Position | null, dest?: Position | null) => {
  const params = new URLSearchParams()
  if (dest) params.set('daddr', `${dest[1]},${dest[0]}`)
  if (origin) params.set('saddr', `${origin[1]},${origin[0]}`)
  return `http://maps.apple.com/?${params.toString()}`
}

export const lastCoord = (coords: Position[]) => (coords && coords.length ? coords[coords.length - 1] : null)

export const deriveNextStep = (currentIndex: number, steps: RouteStepEntry[]): RouteStepEntry | null => {
  if (!steps || !steps.length) return null
  for (const s of steps) {
    if (s.startIndex > currentIndex) return s
  }
  return null
}

// Build synthetic steps from a raw coordinates array
export const stepsFromCoords = (coordinates: Position[]): RouteStepEntry[] => {
  const steps: RouteStepEntry[] = []
  if (!coordinates || coordinates.length < 2) return steps
  let lastIdx = 0
  let acc = 0
  for (let i = 1; i < coordinates.length; i++) {
    acc += haversine(coordinates[i - 1], coordinates[i])
    if (acc >= 300 || i - lastIdx >= 25) {
      steps.push({ startIndex: lastIdx, endIndex: i, text: 'Tiếp tục theo tuyến đường' })
      lastIdx = i
      acc = 0
    }
  }
  steps.push({ startIndex: lastIdx, endIndex: coordinates.length - 1, text: 'Đến điểm đến' })
  return steps
}
