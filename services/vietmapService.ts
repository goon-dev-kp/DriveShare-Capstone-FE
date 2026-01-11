import { vietmapServicesKey } from '@/config/vietmap'
import type { Position } from 'geojson'
import { decodePolyline } from '@/utils/polyline'

const ROUTE_URL = 'https://maps.vietmap.vn/api/route/v3'

export interface RouteInstruction {
  distance: number
  heading: number
  sign: number
  interval: [number, number]
  text: string
  time: number
  street_name: string
  coordinate?: Position // GPS coordinate for this instruction
}

export interface RoutePlanResult {
  coordinates: Position[]
  polyline: string | null
  distance?: number
  time?: number
  instructions?: RouteInstruction[]
  pickupIndex?: number  // Index trong coordinates array khi đến pickup point
  deliveryIndex?: number // Index trong coordinates array khi đến delivery point
}

// Attempts to decode with precision 5, then 6
const decodeGeometry = (geom: string): Position[] => {
  try {
    const { coordinates } = decodePolyline(geom, 5)
    if (coordinates?.length) return coordinates
  } catch {}
  try {
    const { coordinates } = decodePolyline(geom, 6)
    if (coordinates?.length) return coordinates
  } catch {}
  return []
}

// Find closest coordinate index to a given position (Position is [lon, lat])
const closestCoordIndex = (coords: Position[], target: Position): number => {
  if (!coords || !coords.length) return -1
  const toRad = (v: number) => (v * Math.PI) / 180
  const haversine = (a: Position, b: Position) => {
    const [lon1, lat1] = a
    const [lon2, lat2] = b
    const R = 6371000 // meters
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const la1 = toRad(lat1)
    const la2 = toRad(lat2)
    const aa = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
    return R * c
  }

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < coords.length; i++) {
    const d = haversine(coords[i], target)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}

const vietmapService = {
  // Plan route: current -> pickup -> delivery using Route API v3
  async planCurrentToTrip(current: Position, pickup: Position, delivery: Position): Promise<RoutePlanResult> {
    if (!vietmapServicesKey) {
      return { coordinates: [current, pickup, delivery], polyline: null }
    }

    try {
      // Build URL with 3 waypoints: current position -> pickup -> delivery
      const params = new URLSearchParams({
        apikey: vietmapServicesKey,
        points_encoded: 'true',
        vehicle: 'car'
      })
      
      // Add points in order: current -> pickup -> delivery
      // Format per docs: latitude,longitude (lat,lng)
      const formatPoint = (p: Position) => `${p[1]},${p[0]}`

      const isValidPoint = (p: Position) => (
        Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
        Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90
      )

      const points = [current, pickup, delivery]
      for (const p of points) {
        if (!isValidPoint(p)) continue
        params.append('point', formatPoint(p))
      }

      const url = `${ROUTE_URL}?${params.toString()}`
      
      // Debug: log final request URL
      try { console.debug('VietMap route URL:', url) } catch {}

      const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
      let data: any = null

      if (!res.ok) {
        console.error(`Route API error: ${res.status}`)
        try { data = await res.json() } catch { data = null }
        console.error('Route API response body:', data)
        return { coordinates: [current, pickup, delivery], polyline: null }
      }

      try { data = await res.json() } catch (e) { data = null }

      if (data.code !== 'OK' || !data.paths?.[0]) {
        console.error('Route API response invalid:', data.code, data.messages)
        return { coordinates: [current, pickup, delivery], polyline: null }
      }

      const path = data.paths[0]
      const geom: string | undefined = path.points
      const instructions: RouteInstruction[] = path.instructions || []

      if (geom && typeof geom === 'string') {
        const coords = decodeGeometry(geom)
        if (coords.length) {
          // Attach a coordinate to each instruction (use interval start index)
          const mappedInstructions: RouteInstruction[] = (instructions || []).map((ins: any) => {
            const idx = Array.isArray(ins.interval) && typeof ins.interval[0] === 'number' ? Math.max(0, Math.min(coords.length - 1, ins.interval[0])) : 0
            return {
              distance: ins.distance,
              heading: ins.heading,
              sign: ins.sign,
              interval: ins.interval,
              text: ins.text,
              time: ins.time,
              street_name: ins.street_name || '',
              coordinate: coords[idx]
            }
          })

          // Try to find indices where we pass through pickup and delivery points
          let pickupIdx = 0
          let deliveryIdx = coords.length - 1

          // If API provides snapped waypoints, decode them to find exact indices
          if (path.snapped_waypoint && typeof path.snapped_waypoint === 'string') {
            try {
              const snapped = decodeGeometry(path.snapped_waypoint)
              // snapped[0] = start, snapped[1] = pickup, snapped[2] = delivery (when available)
              if (snapped.length >= 2) {
                const pickupSnapped = snapped[1]
                const idx = closestCoordIndex(coords, pickupSnapped)
                if (idx >= 0) pickupIdx = idx
              }
              if (snapped.length >= 3) {
                const deliverySnapped = snapped[2]
                const didx = closestCoordIndex(coords, deliverySnapped)
                if (didx >= 0) deliveryIdx = didx
              }
            } catch (e) {
              console.error('Failed to decode snapped_waypoints:', e)
            }
          }

          return {
            coordinates: coords,
            polyline: geom,
            distance: path.distance,
            time: path.time,
            instructions: mappedInstructions,
            pickupIndex: pickupIdx,
            deliveryIndex: deliveryIdx
          }
        }
      }

      // If we have instructions but couldn't decode coords, still log for debugging
      try { console.debug('VietMap planCurrentToTrip result:', { distance: path.distance, time: path.time, instructionsCount: instructions?.length || 0 }) } catch {}

      // Fallback: straight legs if geometry missing
      return { coordinates: [current, pickup, delivery], polyline: null, instructions: [] }
    } catch (e) {
      console.error('Route API exception:', e)
      
      // Try offline fallback
      const offlineRoute = await this.getOfflineRoute(current, pickup, delivery)
      if (offlineRoute) {
        return offlineRoute
      }
      
      return { coordinates: [current, pickup, delivery], polyline: null, instructions: [] }
    }
  },

  /**
   * Plan route between two arbitrary points (start -> end)
   */
  async planBetweenPoints(start: Position, end: Position, vehicle = 'car'): Promise<RoutePlanResult> {
    if (!vietmapServicesKey) {
      return { coordinates: [start, end], polyline: null }
    }

    try {
      const params = new URLSearchParams({
        apikey: vietmapServicesKey,
        points_encoded: 'true',
        vehicle
      })

      // Format per docs: latitude,longitude (lat,lng)
      const formatPoint = (p: Position) => `${p[1]},${p[0]}`
      const isValidPoint = (p: Position) => (
        Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
        Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90
      )

      const pts = [start, end]
      for (const p of pts) {
        if (!isValidPoint(p)) continue
        params.append('point', formatPoint(p))
      }

      const url = `${ROUTE_URL}?${params.toString()}`
      try { console.debug('VietMap route URL:', url) } catch {}

      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
      let data: any = null

      if (!res.ok) {
        console.error(`Route API error: ${res.status}`)
        try { data = await res.json() } catch { data = null }
        console.error('Route API response body:', data)
        return { coordinates: [start, end], polyline: null }
      }

      try { data = await res.json() } catch (e) { data = null }
      if (data?.code !== 'OK' || !data?.paths?.[0]) {
        console.error('Route API response invalid:', data?.code, data?.messages)
        return { coordinates: [start, end], polyline: null }
      }

      const path = data.paths[0]
      const geom: string | undefined = path.points
      const instructions: RouteInstruction[] = path.instructions || []

      if (geom && typeof geom === 'string') {
        const coords = decodeGeometry(geom)
        if (coords.length) {
          const mappedInstructions: RouteInstruction[] = (instructions || []).map((ins: any) => {
            const idx = Array.isArray(ins.interval) && typeof ins.interval[0] === 'number' ? Math.max(0, Math.min(coords.length - 1, ins.interval[0])) : 0
            return {
              distance: ins.distance,
              heading: ins.heading,
              sign: ins.sign,
              interval: ins.interval,
              text: ins.text,
              time: ins.time,
              street_name: ins.street_name || '',
              coordinate: coords[idx]
            }
          })

          try { console.debug('VietMap planBetweenPoints: coords.length=', coords.length, 'instructions=', mappedInstructions.length) } catch {}

          // For two-point route, pickupIndex is start (0), deliveryIndex is end
          return {
            coordinates: coords,
            polyline: geom,
            distance: path.distance,
            time: path.time,
            instructions: mappedInstructions,
            pickupIndex: 0,
            deliveryIndex: coords.length - 1
          }
        }
      }

      return { coordinates: [start, end], polyline: null, instructions: [] }
    } catch (e) {
      console.error('Route API exception:', e)
      try { console.debug('planBetweenPoints exception, start/end:', start, end) } catch {}
      return { coordinates: [start, end], polyline: null, instructions: [] }
    }
  },

  /**
   * Search address text using VietMap Search API (V1) and optionally bias by focus lat,lng
   * Returns list of matches with address and coordinates [lon, lat]
   */
  async searchAddress(text: string, focus?: Position): Promise<Array<{ address: string; coordinates: Position }>> {
    if (!vietmapServicesKey) return []

    try {
      const encoded = encodeURIComponent(text)
      let url = `https://maps.vietmap.vn/api/search?apikey=${vietmapServicesKey}&text=${encoded}`
      if (focus && focus.length === 2) {
        // focus expects lat,lon
        url += `&focus=${focus[1]},${focus[0]}`
      }

      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
      if (!res.ok) {
        console.warn('Search API failed', res.status)
        return []
      }

      const json = await res.json()

      // Expected shape: { code: 'OK', data: { features: [ { geometry: { coordinates: [lon, lat] }, properties: { label } } ] } }
      if (json?.code !== 'OK' || !json?.data?.features) return []

      const results = (json.data.features as any[]).map(f => {
        const coords = f.geometry?.coordinates || []
        return {
          address: f.properties?.label || f.properties?.name || text,
          coordinates: [coords[0] || 0, coords[1] || 0] as Position
        }
      })

      return results
    } catch (err) {
      console.error('Search API exception', err)
      return []
    }
  },

  /**
   * Offline routing fallback using simple straight-line segments
   * In production, this would use cached road network + A* pathfinding
   */
  async getOfflineRoute(current: Position, pickup: Position, delivery: Position): Promise<RoutePlanResult | null> {
    try {
      // Check if we have cached route data
      // For now, use simple straight-line interpolation
      const currentToPickup = this.interpolatePoints(current, pickup, 10)
      const pickupToDelivery = this.interpolatePoints(pickup, delivery, 10)
      
      const coordinates = [...currentToPickup, ...pickupToDelivery.slice(1)]
      
      // Calculate distance
      const distance = this.calculateDistance(coordinates)
      
      // Estimate time (@ 40 km/h average)
      const time = (distance / 40) * 3600 // seconds
      
      return {
        coordinates,
        polyline: null,
        distance,
        time,
        instructions: [
          {
            distance,
            heading: 0,
            sign: 0,
            interval: [0, coordinates.length - 1],
            text: 'Đi theo tuyến đường (offline)',
            time,
            street_name: 'Offline route',
            coordinate: current
          }
        ],
        pickupIndex: currentToPickup.length - 1,
        deliveryIndex: coordinates.length - 1
      }
    } catch (error) {
      console.error('Offline routing failed:', error)
      return null
    }
  },

  /**
   * Interpolate points between two coordinates
   */
  interpolatePoints(start: Position, end: Position, steps: number): Position[] {
    const points: Position[] = []
    
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps
      const lon = start[0] + (end[0] - start[0]) * fraction
      const lat = start[1] + (end[1] - start[1]) * fraction
      points.push([lon, lat])
    }
    
    return points
  },

  /**
   * Calculate total distance of a route (km)
   */
  calculateDistance(coordinates: Position[]): number {
    let total = 0
    
    for (let i = 1; i < coordinates.length; i++) {
      const [lon1, lat1] = coordinates[i - 1]
      const [lon2, lat2] = coordinates[i]
      
      // Haversine formula
      const R = 6371 // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      total += R * c
    }
    
    return total
  }
}

export default vietmapService
