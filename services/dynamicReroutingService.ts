import vietmapService, { type RoutePlanResult } from '@/services/vietmapService'
import type { Position } from 'geojson'

interface RerouteOption {
  route: RoutePlanResult
  reason: string
  timeSaved: number // seconds
  distanceDiff: number // km
}

class DynamicReroutingService {
  private currentRoute: RoutePlanResult | null = null
  private currentPosition: Position | null = null
  private destination: Position | null = null
  private lastRerouteTime: number = 0
  private readonly MIN_REROUTE_INTERVAL = 120000 // 2 minutes

  /**
   * Set current route being followed
   */
  setCurrentRoute(route: RoutePlanResult) {
    this.currentRoute = route
  }

  /**
   * Update current GPS position
   */
  updatePosition(position: Position) {
    this.currentPosition = position
  }

  /**
   * Set destination
   */
  setDestination(destination: Position) {
    this.destination = destination
  }

  /**
   * Check if rerouting is recommended based on traffic
   * Returns alternative route if significant time savings available
   */
  async checkForBetterRoute(): Promise<RerouteOption | null> {
    // Throttle rerouting checks
    const now = Date.now()
    if (now - this.lastRerouteTime < this.MIN_REROUTE_INTERVAL) {
      return null
    }

    if (!this.currentRoute || !this.currentPosition || !this.destination) {
      return null
    }

    try {
      // Get alternative route from current position to destination
      const alternativeRoute = await vietmapService.planCurrentToTrip(
        this.currentPosition,
        this.destination,
        this.destination // Use same point for pickup/delivery
      )

      if (!alternativeRoute.time || !this.currentRoute.time) {
        return null
      }

      // Calculate time difference
      const currentETA = this.estimateRemainingTime()
      const alternativeETA = alternativeRoute.time

      const timeSaved = currentETA - alternativeETA

      // Only suggest reroute if saves >= 5 minutes
      if (timeSaved >= 300) {
        this.lastRerouteTime = now

        const distanceDiff = (alternativeRoute.distance || 0) - (this.currentRoute.distance || 0)

        return {
          route: alternativeRoute,
          reason: timeSaved >= 600 
            ? '🚦 Giao thông tắc nghẽn - Tìm thấy đường nhanh hơn'
            : '⚡ Tìm thấy đường ngắn hơn',
          timeSaved,
          distanceDiff
        }
      }

      return null
    } catch (error) {
      console.error('Rerouting check failed:', error)
      return null
    }
  }

  /**
   * Estimate remaining time on current route (seconds)
   */
  private estimateRemainingTime(): number {
    if (!this.currentRoute || !this.currentPosition) {
      return 0
    }

    // Find nearest point on route
    const coords = this.currentRoute.coordinates
    let nearestIndex = 0
    let minDist = Infinity

    for (let i = 0; i < coords.length; i++) {
      const dist = this.distance(this.currentPosition, coords[i])
      if (dist < minDist) {
        minDist = dist
        nearestIndex = i
      }
    }

    // Calculate remaining distance
    let remainingDist = 0
    for (let i = nearestIndex; i < coords.length - 1; i++) {
      remainingDist += this.distance(coords[i], coords[i + 1])
    }

    // Estimate time @ 40 km/h average
    return (remainingDist / 40) * 3600
  }

  /**
   * Calculate distance between two points (km)
   */
  private distance(p1: Position, p2: Position): number {
    const [lon1, lat1] = p1
    const [lon2, lat2] = p2

    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  /**
   * Format time saved for display
   */
  formatTimeSaved(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) {
      return `${minutes} phút`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
}

// Lazy singleton - only instantiate when first accessed
let instance: DynamicReroutingService | null = null

export function getDynamicReroutingService(): DynamicReroutingService {
  if (!instance) {
    instance = new DynamicReroutingService()
  }
  return instance
}

export default getDynamicReroutingService
export type { RerouteOption }
