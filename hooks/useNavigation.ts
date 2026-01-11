import { useState, useEffect, useCallback, useRef } from 'react'
import { RouteSimulator } from '@/utils/RouteSimulator'
import { toGeoJSONLineFeature } from '@/utils/polyline'
import type { Feature, LineString, Point } from 'geojson'

export interface NavigationState {
  isActive: boolean
  currentPoint: Feature<Point, { distance: number; nearestIndex: number }> | null
  progressFeature: Feature<LineString> | null
  progressDistance: number
  totalDistance: number
  progressPercent: number
}

export interface NavigationControls {
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
}

export interface UseNavigationOptions {
  coordinates: [number, number][]
  speed?: number // km per tick
  onProgress?: (state: NavigationState) => void
  autoStart?: boolean
}

/**
 * Hook quản lý navigation state với RouteSimulator
 * 
 * @example
 * ```tsx
 * const { state, controls } = useNavigation({
 *   coordinates: routeCoords,
 *   speed: 0.05,
 *   onProgress: (state) => {
 *     console.log(`Progress: ${state.progressPercent}%`)
 *   }
 * })
 * 
 * <Button onPress={controls.toggle}>
 *   {state.isActive ? 'Stop' : 'Start'}
 * </Button>
 * 
 * <RouteMap
 *   coordinates={coordinates}
 *   navigationActive={state.isActive}
 *   progressFeature={state.progressFeature}
 *   pulseMarker={state.currentPoint?.geometry.coordinates}
 * />
 * ```
 */
export const useNavigation = ({
  coordinates,
  speed = 0.04,
  onProgress,
  autoStart = false
}: UseNavigationOptions): {
  state: NavigationState
  controls: NavigationControls
} => {
  const [isActive, setIsActive] = useState(autoStart)
  const [currentPoint, setCurrentPoint] = useState<NavigationState['currentPoint']>(null)
  const [progressFeature, setProgressFeature] = useState<Feature<LineString> | null>(null)
  const [progressDistance, setProgressDistance] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0)
  
  const simulatorRef = useRef<RouteSimulator | null>(null)

  // Calculate progress percentage
  const progressPercent = totalDistance > 0 ? (progressDistance / totalDistance) * 100 : 0

  // Create state object
  const state: NavigationState = {
    isActive,
    currentPoint,
    progressFeature,
    progressDistance,
    totalDistance,
    progressPercent
  }

  // Initialize and cleanup simulator
  useEffect(() => {
    if (!isActive || !coordinates || coordinates.length < 2) {
      if (simulatorRef.current) {
        simulatorRef.current.stop()
        simulatorRef.current = null
      }
      setCurrentPoint(null)
      setProgressFeature(null)
      setProgressDistance(0)
      return
    }

    const routeFeature = toGeoJSONLineFeature(coordinates)
    const simulator = new RouteSimulator(routeFeature, speed)
    simulatorRef.current = simulator

    // Store total distance
    setTotalDistance(simulator['polyline'].totalDistance)

    simulator.addListener((point) => {
      setCurrentPoint(point)
      setProgressDistance(point.properties.distance)

      // Create progress line
      const { nearestIndex } = point.properties
      const progressCoords = coordinates
        .filter((_, i) => i <= nearestIndex)
        .concat([point.geometry.coordinates as [number, number]])

      if (progressCoords.length >= 2) {
        setProgressFeature(toGeoJSONLineFeature(progressCoords))
      }

      // Call onProgress callback
      if (onProgress) {
        const currentState: NavigationState = {
          isActive: true,
          currentPoint: point,
          progressFeature: toGeoJSONLineFeature(progressCoords),
          progressDistance: point.properties.distance,
          totalDistance: simulator['polyline'].totalDistance,
          progressPercent: (point.properties.distance / simulator['polyline'].totalDistance) * 100
        }
        onProgress(currentState)
      }
    })

    simulator.start()

    return () => {
      simulator.stop()
      simulatorRef.current = null
    }
  }, [isActive, coordinates, speed, onProgress])

  // Control functions
  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    if (simulatorRef.current) {
      simulatorRef.current.reset()
    }
    setCurrentPoint(null)
    setProgressFeature(null)
    setProgressDistance(0)
  }, [])

  const controls: NavigationControls = {
    start,
    stop,
    toggle,
    reset
  }

  return { state, controls }
}

/**
 * Hook tính toán ETA và các metrics navigation
 * 
 * @example
 * ```tsx
 * const metrics = useNavigationMetrics({
 *   remainingDistance: state.totalDistance - state.progressDistance,
 *   averageSpeed: 30 // km/h
 * })
 * 
 * <NavigationHUD
 *   eta={metrics.eta}
 *   remainingDistance={metrics.remainingDistanceFormatted}
 *   currentSpeed={metrics.speedFormatted}
 * />
 * ```
 */
export const useNavigationMetrics = ({
  remainingDistance,
  averageSpeed = 30
}: {
  remainingDistance: number
  averageSpeed?: number
}) => {
  const [eta, setEta] = useState<string>('--:--')
  const [remainingTime, setRemainingTime] = useState<number>(0)

  useEffect(() => {
    if (!remainingDistance || remainingDistance <= 0 || !averageSpeed || averageSpeed < 1) {
      setEta('--:--')
      setRemainingTime(0)
      return
    }

    const hoursRemaining = remainingDistance / averageSpeed
    setRemainingTime(hoursRemaining * 60) // in minutes

    const now = new Date()
    const etaTime = new Date(now.getTime() + hoursRemaining * 3600000)
    setEta(
      etaTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    )
  }, [remainingDistance, averageSpeed])

  return {
    eta,
    remainingTime,
    remainingDistanceFormatted: `${remainingDistance.toFixed(1)} km`,
    speedFormatted: `${averageSpeed.toFixed(0)} km/h`,
    remainingTimeFormatted: `${Math.ceil(remainingTime)} phút`
  }
}
