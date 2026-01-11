import type { Position, Feature, LineString } from 'geojson'
import { toGeoJSONLineFeature } from './polyline'

/**
 * Create progress feature showing traveled portion of route
 * @param routeCoords - Full route coordinates
 * @param currentIndex - Current position index on route
 * @param currentPos - Current GPS position
 * @returns GeoJSON LineString feature of traveled route
 */
export function createProgressFeature(
  routeCoords: [number, number][],
  currentIndex: number,
  currentPos?: Position
): Feature<LineString> | null {
  if (!routeCoords || routeCoords.length === 0) return null
  if (currentIndex === 0 && !currentPos) return null
  
  // Build progress line: from start to current position
  const progressCoords: [number, number][] = []
  
  // Add all coords up to current index
  for (let i = 0; i <= currentIndex && i < routeCoords.length; i++) {
    progressCoords.push(routeCoords[i])
  }
  
  // Add current position if available (more accurate than snapped point)
  if (currentPos && progressCoords.length > 0) {
    // Only add if different from last point
    const lastPoint = progressCoords[progressCoords.length - 1]
    if (currentPos[0] !== lastPoint[0] || currentPos[1] !== lastPoint[1]) {
      progressCoords.push(currentPos as [number, number])
    }
  }
  
  if (progressCoords.length < 2) return null
  
  return toGeoJSONLineFeature(progressCoords)
}

/**
 * Create remaining route feature (not yet traveled)
 * @param routeCoords - Full route coordinates
 * @param currentIndex - Current position index on route
 * @param currentPos - Current GPS position
 * @returns GeoJSON LineString feature of remaining route
 */
export function createRemainingFeature(
  routeCoords: [number, number][],
  currentIndex: number,
  currentPos?: Position
): Feature<LineString> | null {
  if (!routeCoords || routeCoords.length === 0) return null
  if (currentIndex >= routeCoords.length - 1) return null
  
  const remainingCoords: [number, number][] = []
  
  // Add current position as start
  if (currentPos) {
    remainingCoords.push(currentPos as [number, number])
  }
  
  // Add all coords from current index to end
  for (let i = currentIndex + 1; i < routeCoords.length; i++) {
    remainingCoords.push(routeCoords[i])
  }
  
  if (remainingCoords.length < 2) return null
  
  return toGeoJSONLineFeature(remainingCoords)
}

/**
 * Calculate progress percentage
 * @param totalDistance - Total route distance in meters
 * @param remainingDistance - Remaining distance in meters
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(
  totalDistance: number,
  remainingDistance: number
): number {
  if (totalDistance <= 0) return 0
  const traveled = totalDistance - remainingDistance
  return Math.max(0, Math.min(100, (traveled / totalDistance) * 100))
}
