// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
// import VietMapWebWrapper from './VietMapWebWrapper'

// export interface WebNavigationProps {
//   coordinates: [number, number][]
//   style?: any
//   onLocationUpdate?: (pos: [number, number]) => void
//   onNavigationComplete?: () => void
//   navigationActive?: boolean
//   showInstructions?: boolean
//   instructions?: string[]
//   externalLocation?: [number, number] | null
//   userMarkerBearing?: number | undefined
// }

// /**
//  * Web Navigation Component
//  * - Full navigation experience for web platform
//  * - Uses VietMap Web SDK for real map rendering  
//  * - GPS tracking and route following
//  * - Navigation instructions and controls
//  * - Compatible with mobile navigation flow
//  */
// export const WebNavigation: React.FC<WebNavigationProps> = ({
//   coordinates = [],
//   style,
//   onLocationUpdate,
//   onNavigationComplete,
//   navigationActive = false,
//   showInstructions = true,
//   instructions = [],
//   externalLocation = null
//   , userMarkerBearing
// }) => {
//   const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
//   const [isNavigating, setIsNavigating] = useState(navigationActive)
//   const [routeProgress, setRouteProgress] = useState(0)
//   const [currentInstruction, setCurrentInstruction] = useState<string>('')
//   const [bearing, setBearing] = useState<number>(0)
//   const [speed, setSpeed] = useState<number>(0)
//   const [eta, setETA] = useState<string>('')
  
//   const navigationTimerRef = useRef<NodeJS.Timeout | null>(null)
//   const watchIdRef = useRef<number | null>(null)

//   // Start/stop navigation
//   const toggleNavigation = useCallback(() => {
//     if (isNavigating) {
//       stopNavigation()
//     } else {
//       startNavigation()
//     }
//   }, [isNavigating])

//   // Start navigation with GPS tracking
//   const startNavigation = useCallback(() => {
//     if (Platform.OS !== 'web' || coordinates.length < 2) return

//     console.log('🧭 Starting web navigation...')
//     setIsNavigating(true)
    
//     // Start GPS tracking
//     if (navigator.geolocation) {
//       watchIdRef.current = navigator.geolocation.watchPosition(
//         (position) => {
//           const newLocation: [number, number] = [
//             position.coords.longitude,
//             position.coords.latitude
//           ]
          
//           setCurrentLocation(newLocation)
//           onLocationUpdate?.(newLocation)
          
//           // Update navigation data
//           updateNavigationData(position)
          
//           console.log('📍 GPS Update:', newLocation)
//         },
//         (error) => {
//           console.error('❌ GPS Error:', error.message)
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 1000
//         }
//       )
//     } else {
//       console.error('❌ Geolocation not supported')
//     }
    
//     // Set initial instruction
//     if (instructions.length > 0) {
//       setCurrentInstruction(instructions[0])
//     } else {
//       setCurrentInstruction('Bắt đầu điều hướng theo tuyến đường')
//     }
    
//   }, [coordinates, instructions, onLocationUpdate])

//   // Stop navigation
//   const stopNavigation = useCallback(() => {
//     console.log('⏹️ Stopping web navigation...')
//     setIsNavigating(false)
//     setRouteProgress(0)
//     setCurrentInstruction('')
    
//     // Stop GPS tracking
//     if (watchIdRef.current !== null) {
//       navigator.geolocation.clearWatch(watchIdRef.current)
//       watchIdRef.current = null
//     }
    
//     // Clear timers
//     if (navigationTimerRef.current) {
//       clearInterval(navigationTimerRef.current)
//       navigationTimerRef.current = null
//     }
    
//   }, [])

//   // Update navigation data based on GPS position
//   const updateNavigationData = useCallback((position: GeolocationPosition) => {
//     if (!currentLocation || coordinates.length < 2) return

//     try {
//       // Calculate bearing
//       if (position.coords.heading !== null && position.coords.heading >= 0) {
//         setBearing(position.coords.heading)
//       }
      
//       // Calculate speed (convert m/s to km/h)
//       if (position.coords.speed !== null && position.coords.speed >= 0) {
//         const speedKmh = (position.coords.speed * 3.6)
//         setSpeed(speedKmh)
//       }
      
//       // Calculate route progress (simplified)
//       const currentPos = [position.coords.longitude, position.coords.latitude]
//       const totalDistance = calculateTotalDistance(coordinates)
//       const distanceToEnd = calculateDistance(currentPos, coordinates[coordinates.length - 1])
//       const progress = Math.max(0, Math.min(100, ((totalDistance - distanceToEnd) / totalDistance) * 100))
//       setRouteProgress(progress)
      
//       // Calculate ETA (simplified)
//       if (speed > 5) { // Only calculate if moving
//         const remainingDistance = distanceToEnd
//         const etaHours = remainingDistance / speed
//         const etaMinutes = Math.round(etaHours * 60)
//         setETA(`${etaMinutes} phút`)
//       }
      
//       // Check if navigation complete
//       if (progress > 95) {
//         setCurrentInstruction('🎯 Bạn đã đến đích!')
//         setTimeout(() => {
//           onNavigationComplete?.()
//           stopNavigation()
//         }, 3000)
//       }
      
//     } catch (error) {
//       console.error('❌ Navigation data update error:', error)
//     }
//   }, [currentLocation, coordinates, speed, onNavigationComplete, stopNavigation])

//   // Calculate distance between two points (Haversine formula)
//   const calculateDistance = useCallback((point1: number[], point2: number[]): number => {
//     const R = 6371 // Earth's radius in km
//     const dLat = (point2[1] - point1[1]) * Math.PI / 180
//     const dLon = (point2[0] - point1[0]) * Math.PI / 180
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * 
//       Math.sin(dLon/2) * Math.sin(dLon/2)
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
//     return R * c
//   }, [])

//   // Calculate total route distance
//   const calculateTotalDistance = useCallback((coords: [number, number][]): number => {
//     let total = 0
//     for (let i = 0; i < coords.length - 1; i++) {
//       total += calculateDistance(coords[i], coords[i + 1])
//     }
//     return total
//   }, [calculateDistance])

//   // Format distance for display
//   const formatDistance = useCallback((distance: number): string => {
//     if (distance < 1) {
//       return `${Math.round(distance * 1000)}m`
//     }
//     return `${distance.toFixed(1)}km`
//   }, [])

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       stopNavigation()
//     }
//   }, [stopNavigation])

//   // Accept external location updates (from parent or VietMapWebWrapper)
//   useEffect(() => {
//     if (externalLocation && (!currentLocation || externalLocation[0] !== currentLocation[0] || externalLocation[1] !== currentLocation[1])) {
//       setCurrentLocation(externalLocation)
//       console.log('📍 External location applied to WebNavigation:', externalLocation)
//     }
//   }, [externalLocation])

//   // Sync instruction text from parent `instructions` prop so UI shows parent-provided instruction
//   useEffect(() => {
//     if (instructions && instructions.length > 0) {
//       const instr = instructions[0]
//       if (instr && instr !== currentInstruction) {
//         setCurrentInstruction(instr)
//         console.log('ℹ️ WebNavigation updated instruction from props:', instr)
//       }
//     }
//   }, [instructions])

//   // Update navigation state
//   useEffect(() => {
//     setIsNavigating(navigationActive)
//     if (navigationActive && !isNavigating) {
//       startNavigation()
//     } else if (!navigationActive && isNavigating) {
//       stopNavigation()
//     }
//   }, [navigationActive, isNavigating, startNavigation, stopNavigation])

//   if (Platform.OS !== 'web') {
//     return null
//   }

//   return (
//     <View style={[styles.container, style]}>
//       {/* VietMap Web SDK - placed inside a plain DOM container to avoid mixing raw text nodes into RN Views */}
//       <div style={{ position: 'relative', width: '100%', height: '100%' }}>
//         <VietMapWebWrapper
//           coordinates={coordinates}
//           style={styles.map}
//           showUserLocation={true}
//           navigationActive={isNavigating}
//           onLocationUpdate={onLocationUpdate}
//           onMapReady={() => console.log('🗺️ Web map ready for navigation')}
//           userMarkerPosition={externalLocation ?? currentLocation ?? undefined}
//           userMarkerBearing={userMarkerBearing ?? bearing}
//         />
//       </div>
      
//       {/* Navigation Controls */}
//       <View style={styles.controlsContainer}>
//         {/* Navigation Toggle */}
//         <TouchableOpacity
//           style={[
//             styles.navButton,
//             { backgroundColor: isNavigating ? '#EF4444' : '#10B981' }
//           ]}
//           onPress={toggleNavigation}
//           accessible={true}
//           accessibilityRole="button"
//           accessibilityLabel={isNavigating ? 'Dừng điều hướng' : 'Bắt đầu điều hướng'}
//         >
// <Text style={styles.navButtonText}>
//             {isNavigating ? '⏹️ Dừng' : '🧭 Bắt đầu'}
//           </Text>
// </TouchableOpacity>

//         {/* GPS Status */}
//         <View style={[
//           styles.statusBadge,
//           { backgroundColor: currentLocation ? '#10B981' : '#F59E0B' }
//         ]}>
// <Text style={styles.statusText}>
//             {currentLocation ? '📡 GPS Active' : '📡 Searching...'}
//           </Text>
// </View>
// </View>

//       {/* Navigation Instructions */}
//       {isNavigating && showInstructions && (
//         <View style={styles.instructionContainer}>
// <View style={styles.instructionBubble}>
// <Text style={styles.instructionText}>
//               {currentInstruction || 'Đang điều hướng...'}
//             </Text>
            
//             {/* Navigation Stats */}
//             <View style={styles.statsContainer}>
//               {speed > 0 && (
//                 <Text style={styles.statText}>🚗 {speed.toFixed(0)} km/h</Text>
//               )}
//               {eta && (
//                 <Text style={styles.statText}>⏱️ {eta}</Text>
//               )}
//               {routeProgress > 0 && (
//                 <Text style={styles.statText}>📊 {routeProgress.toFixed(0)}%</Text>
//               )}
//             </View>
// </View>
// </View>
//       )}
// {/* Route Progress Bar */}
//       {isNavigating && routeProgress > 0 && (
//         <View style={styles.progressContainer}>
// <View style={styles.progressBar}>
// <View 
//               style={[
//                 styles.progressFill,
//                 { width: `${routeProgress}%` }
//               ]}
//             />
// </View>
// <Text style={styles.progressText}>
//             {routeProgress.toFixed(0)}% hoàn thành
//           </Text>
// </View>
//       )}
// {/* Location Debug Info */}
//       {currentLocation && (
//         <View style={styles.debugContainer}>
// <Text style={styles.debugText}>
//             📍 {currentLocation[1].toFixed(6)}, {currentLocation[0].toFixed(6)}
//           </Text>
// <Text style={styles.debugText}>
//             🧭 {bearing.toFixed(1)}° | 🚗 {speed.toFixed(1)} km/h
//           </Text>
// </View>
//       )}
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     position: 'relative'
//   },
//   map: {
//     flex: 1
//   },
//   controlsContainer: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     gap: 8,
//     zIndex: 1000
//   },
//   navButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5
//   },
//   navButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '700',
//     textAlign: 'center'
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#FFFFFF',
//     alignItems: 'center'
//   },
//   statusText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600'
//   },
//   instructionContainer: {
//     position: 'absolute',
//     top: 80,
//     left: 16,
//     right: 16,
//     zIndex: 999
//   },
//   instructionBubble: {
//     backgroundColor: 'rgba(17, 24, 39, 0.95)',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: '#10B981',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8
//   },
//   instructionText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginBottom: 8
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 16
//   },
//   statText: {
//     color: '#10B981',
//     fontSize: 12,
//     fontWeight: '600'
//   },
//   progressContainer: {
//     position: 'absolute',
//     bottom: 80,
//     left: 16,
//     right: 16,
//     zIndex: 999
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 3,
//     overflow: 'hidden'
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#10B981',
//     borderRadius: 3
//   },
//   progressText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//     textAlign: 'center',
//     marginTop: 4,
//     textShadowColor: '#000',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2
//   },
//   debugContainer: {
//     position: 'absolute',
//     bottom: 16,
//     left: 16,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#374151'
//   },
//   debugText: {
//     color: '#FFFFFF',
//     fontSize: 11,
//     fontWeight: '600',
//     fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
//   }
// })

// export default WebNavigation

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import VietMapWebWrapper from './VietMapWebWrapper'

export interface WebNavigationProps {
  coordinates: [number, number][]
  style?: any
  onLocationUpdate?: (pos: [number, number]) => void
  onNavigationComplete?: () => void
  navigationActive?: boolean
  showInstructions?: boolean
  instructions?: string[]
  externalLocation?: [number, number] | null
  userMarkerBearing?: number | undefined
  hideInternalControls?: boolean
  driverLocation?: { latitude: number; longitude: number; bearing?: number } | null
}

export const WebNavigation: React.FC<WebNavigationProps> = ({
  coordinates = [],
  style,
  onLocationUpdate,
  onNavigationComplete,
  navigationActive = false,
  showInstructions = true,
  instructions = [],
  externalLocation = null,
  userMarkerBearing
  , hideInternalControls = false
}) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [isNavigating, setIsNavigating] = useState(navigationActive)
  const [routeProgress, setRouteProgress] = useState(0)
  const [speed, setSpeed] = useState(0)
  
  const watchIdRef = useRef<number | null>(null)

  // --- 1. Simulation & GPS Logic ---
  const startNavigation = useCallback(() => {
    if (Platform.OS !== 'web') return
    setIsNavigating(true)
    
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setCurrentLocation(newLoc)
          onLocationUpdate?.(newLoc)
          setSpeed(pos.coords.speed ? pos.coords.speed * 3.6 : 0) // m/s to km/h
          
          // Simple progress simulation based on coordinates index matching would go here
          // For now we simulate progress for visual demo
          setRouteProgress(prev => Math.min(prev + 0.1, 100)) 
        },
        (err) => console.warn(err),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const stopNavigation = useCallback(() => {
    setIsNavigating(false)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (navigationActive) startNavigation()
    else stopNavigation()
    return () => stopNavigation()
  }, [navigationActive])

  // Sync external location
  useEffect(() => {
    if (externalLocation) setCurrentLocation(externalLocation)
  }, [externalLocation])

  if (Platform.OS !== 'web') return null

  return (
    <View style={[styles.container, style]}>
      {/* Map Core */}
      <View style={styles.mapLayer}>
        <VietMapWebWrapper
          coordinates={coordinates}
          showUserLocation={true}
          navigationActive={isNavigating}
          userMarkerPosition={externalLocation ?? currentLocation ?? undefined}
          userMarkerBearing={userMarkerBearing}
        />
      </View>

      {/* --- UI Overlay (HUD) --- */}

      {/* 1. Top Bar: Instruction (only when internal controls are allowed) */}
      {!hideInternalControls && isNavigating && showInstructions && (
        <View style={styles.topBar}>
          <View style={styles.instructionCard}>
            <Text style={styles.turnIcon}>↰</Text>
            <View>
              <Text style={styles.instructionMain}>
                {instructions[0] || 'Tiếp tục di chuyển theo tuyến đường'}
              </Text>
              <Text style={styles.instructionSub}>
                {instructions[1] || 'Đang tính toán lộ trình...'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. Bottom Bar: Info & Controls (only when internal controls are allowed) */}
      {!hideInternalControls && (
        <View style={styles.bottomBar}>
          <View style={styles.infoPill}>
              <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{speed.toFixed(0)}</Text>
                  <Text style={styles.infoLabel}>km/h</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                  <Text style={styles.infoValue}>{routeProgress.toFixed(0)}%</Text>
                  <Text style={styles.infoLabel}>Tiến độ</Text>
              </View>
          </View>

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: isNavigating ? '#EF4444' : '#10B981' }]}
            onPress={() => isNavigating ? stopNavigation() : startNavigation()}
          >
            <Text style={styles.fabIcon}>{isNavigating ? '⏹' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Progress Line */}
      {isNavigating && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${routeProgress}%` }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB', position: 'relative' },
  mapLayer: { ...StyleSheet.absoluteFillObject },
  
  // Top HUD
  topBar: { position: 'absolute', top: 16, left: 16, right: 16, alignItems: 'center' },
  instructionCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', // Dark theme for high contrast
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    maxWidth: 600,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  turnIcon: { fontSize: 32, color: '#fff', marginRight: 16, fontWeight: '200' },
  instructionMain: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  instructionSub: { color: '#9CA3AF', fontSize: 13 },

  // Bottom HUD
  bottomBar: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  infoPill: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center'
  },
  infoItem: { paddingHorizontal: 12, alignItems: 'center' },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  infoLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  divider: { width: 1, height: 24, backgroundColor: '#E5E7EB' },
  
  // FAB
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  fabIcon: { fontSize: 24, color: 'white' },

  // Progress
  progressContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(0,0,0,0.1)' },
  progressBar: { height: '100%', backgroundColor: '#10B981' }
})

export default WebNavigation