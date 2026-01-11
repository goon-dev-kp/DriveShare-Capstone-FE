import type { Position } from 'geojson'

/**
 * Calculate ETA (Estimated Time of Arrival) based on remaining distance and average speed
 * @param remainingMeters - Remaining distance in meters
 * @param averageSpeedKmh - Average speed in km/h (default: 40 km/h for urban driving)
 * @returns Formatted ETA string (e.g., "15 phút" or "14:30")
 */
export function calculateETA(remainingMeters: number, averageSpeedKmh: number = 40): string {
  if (remainingMeters <= 0) return 'Đã đến'
  
  const remainingKm = remainingMeters / 1000
  const hoursToArrive = remainingKm / averageSpeedKmh
  const minutesToArrive = Math.round(hoursToArrive * 60)
  
  if (minutesToArrive < 1) return '< 1 phút'
  if (minutesToArrive < 60) return `${minutesToArrive} phút`
  
  const hours = Math.floor(minutesToArrive / 60)
  const minutes = minutesToArrive % 60
  
  if (minutes === 0) return `${hours} giờ`
  return `${hours}h ${minutes}m`
}

/**
 * Calculate estimated arrival time (clock time)
 * @param remainingMeters - Remaining distance in meters
 * @param averageSpeedKmh - Average speed in km/h
 * @returns Formatted time string (e.g., "14:30")
 */
export function calculateArrivalTime(remainingMeters: number, averageSpeedKmh: number = 40): string {
  if (remainingMeters <= 0) return 'Đã đến'
  
  const remainingKm = remainingMeters / 1000
  const hoursToArrive = remainingKm / averageSpeedKmh
  const minutesToArrive = Math.round(hoursToArrive * 60)
  
  const now = new Date()
  const arrivalTime = new Date(now.getTime() + minutesToArrive * 60000)
  
  const hours = arrivalTime.getHours().toString().padStart(2, '0')
  const minutes = arrivalTime.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
}

/**
 * Format speed in km/h
 * @param speedMps - Speed in meters per second
 * @returns Formatted speed string (e.g., "45 km/h")
 */
export function formatSpeed(speedMps: number | null | undefined): string {
  if (!speedMps || speedMps < 0) return '0 km/h'
  
  const kmh = Math.round(speedMps * 3.6) // m/s to km/h
  return `${kmh} km/h`
}

/**
 * Calculate average speed from position history
 * @param positions - Array of [timestamp, position] tuples
 * @returns Average speed in m/s
 */
export function calculateAverageSpeed(positions: [number, Position][]): number {
  if (positions.length < 2) return 0
  
  let totalDistance = 0
  const startTime = positions[0][0]
  const endTime = positions[positions.length - 1][0]
  const totalTime = (endTime - startTime) / 1000 // Convert to seconds
  
  if (totalTime <= 0) return 0
  
  for (let i = 1; i < positions.length; i++) {
    const [, pos1] = positions[i - 1]
    const [, pos2] = positions[i]
    
    // Haversine distance calculation
    const R = 6371e3 // Earth radius in meters
    const lat1 = pos1[1] * Math.PI / 180
    const lat2 = pos2[1] * Math.PI / 180
    const deltaLat = (pos2[1] - pos1[1]) * Math.PI / 180
    const deltaLng = (pos2[0] - pos1[0]) * Math.PI / 180
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    totalDistance += R * c
  }
  
  return totalDistance / totalTime // m/s
}

/**
 * Smooth speed value to reduce jitter
 * @param currentSpeed - Current speed in m/s
 * @param previousSpeed - Previous speed in m/s
 * @param alpha - Smoothing factor (0-1, higher = more responsive)
 * @returns Smoothed speed in m/s
 */
export function smoothSpeed(
  currentSpeed: number,
  previousSpeed: number,
  alpha: number = 0.3
): number {
  if (!previousSpeed) return currentSpeed
  return alpha * currentSpeed + (1 - alpha) * previousSpeed
}
