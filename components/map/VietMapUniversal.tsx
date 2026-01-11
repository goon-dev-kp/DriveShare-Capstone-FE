

import React, { Suspense, forwardRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import SafeVietMapComponent, { SafeVietMapRef } from './SafeVietMapComponent'
import VietMapWebWrapper from './VietMapWebWrapper'
import WebNavigation from './WebNavigation'

export interface VietMapUniversalProps {
  coordinates?: [number, number][]
  secondaryRoute?: [number, number][] // optional secondary route to render (e.g., pickup route)
  style?: any
  showUserLocation?: boolean
  navigationActive?: boolean
  onLocationUpdate?: (pos: [number, number]) => void
  onNavigationComplete?: () => void
  showInstructions?: boolean
  instructions?: string[]
  externalLocation?: [number, number] | null
  useWebNavigation?: boolean
  userMarkerBearing?: number | undefined
  primaryRouteColor?: string
  secondaryRouteColor?: string
  driverLocation?: { latitude: number; longitude: number; bearing?: number } | null
}

const LoadingFallback = () => (
  <View style={styles.centerContainer}>
    <View style={styles.loadingCard}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
    </View>
  </View>
)

// ⚠️ QUAN TRỌNG: Dùng forwardRef để truyền ref xuống component con
const VietMapUniversal = forwardRef<SafeVietMapRef, VietMapUniversalProps>((props, ref) => {
  const {
    coordinates = [],
    navigationActive = false,
    useWebNavigation = false,
    externalLocation,
    userMarkerBearing,
    driverLocation
  } = props

  const renderWebComponent = () => {
    // Logic Web: Chọn Navigation hoặc View thường
    const shouldNavigate = useWebNavigation || (navigationActive && coordinates.length > 1)
    
    if (shouldNavigate) {
      // When app-level navigation is active, hide the WebNavigation's internal HUD/controls
      // to avoid duplicate FABs and speed badge overlapping with app UI.
      return <WebNavigation {...props} coordinates={coordinates} externalLocation={externalLocation} userMarkerBearing={userMarkerBearing} hideInternalControls={navigationActive} driverLocation={driverLocation} />
    }
    return <VietMapWebWrapper {...props} coordinates={coordinates} userMarkerPosition={externalLocation ?? undefined} userMarkerBearing={userMarkerBearing} secondaryRoute={props.secondaryRoute} primaryRouteColor={props.primaryRouteColor} secondaryRouteColor={props.secondaryRouteColor} driverLocation={driverLocation} />
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
        {Platform.OS === 'web' ? (
          renderWebComponent()
        ) : (
          // Truyền ref xuống SafeVietMapComponent để gọi recenter()
          <SafeVietMapComponent
            ref={ref} 
            {...props}
            coordinates={coordinates}
            externalLocation={externalLocation}
            userMarkerBearing={userMarkerBearing}
            driverLocation={driverLocation}
          />
        )}
    </Suspense>
  )
})

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    minHeight: 200,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#374151' },
})

export default VietMapUniversal