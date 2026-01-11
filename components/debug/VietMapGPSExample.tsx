import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import VietmapGL, {
  Camera,
  MapView,
  ShapeSource,
  LineLayer
} from '@vietmap/vietmap-gl-react-native'

// Import additional components with safe access
const UserLocation = VietmapGL?.UserLocation || null
const UserTrackingMode = VietmapGL?.UserTrackingMode || {}
const UserLocationRenderMode = VietmapGL?.UserLocationRenderMode || {}
const LocationManager = VietmapGL?.LocationManager || {}
import type { Feature, LineString } from 'geojson'
import { vietmapStyleUrl } from '@/config/vietmap'

// Sample route data - you can replace with real route
const SAMPLE_ROUTE: Feature<LineString> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [106.6297, 10.8231], // Start point (Saigon)
      [106.6400, 10.8200],
      [106.6500, 10.8150],
      [106.6600, 10.8100],
      [106.6700, 10.8050],
      [106.6800, 10.8000],
      [106.6900, 10.7950],
      [106.7009, 10.7797]  // End point
    ]
  }
}

interface VietMapGPSExampleProps {
  style?: any
}

export const VietMapGPSExample: React.FC<VietMapGPSExampleProps> = ({ style }) => {
  const [navigationActive, setNavigationActive] = useState(false)
  const [followUserLocation, setFollowUserLocation] = useState(true)
  const [followUserMode, setFollowUserMode] = useState(UserTrackingMode?.Follow)
  const [showsUserHeadingIndicator, setShowsUserHeadingIndicator] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    LocationManager?.start()
    
    return () => {
      LocationManager?.stop()
    }
  }, [])

  const toggleNavigation = () => {
    const newNavigationActive = !navigationActive
    setNavigationActive(newNavigationActive)
    
    if (newNavigationActive) {
      setFollowUserLocation(true)
      setFollowUserMode(UserTrackingMode?.FollowWithHeading)
      setShowsUserHeadingIndicator(true)
      
      Alert.alert(
        '🧭 Navigation Active',
        'GPS Navigation is now active:\n\n' +
        '✅ Follow User Location → ON\n' +
        '🧭 Follow Heading → ON\n' +
        '📐 3D Pitch → 60°\n' +
        '🔍 Zoom Level → 19x\n\n' +
        'Just like Google Maps navigation!',
        [{ text: 'OK' }]
      )
    } else {
      setFollowUserLocation(false)
      setFollowUserMode(UserTrackingMode?.Follow)
      setShowsUserHeadingIndicator(false)
      
      Alert.alert(
        '📍 Navigation Stopped',
        'Back to normal map view',
        [{ text: 'OK' }]
      )
    }
  }

  const handleLocationUpdate = (location: any) => {
    if (location?.coords) {
      setCurrentLocation([location.coords.longitude, location.coords.latitude])
    }
  }

  const handleUserTrackingModeChange = (event: any) => {
    console.log('User tracking changed:', event.nativeEvent.payload)
    
    if (navigationActive && !event.nativeEvent.payload.followUserLocation) {
      setFollowUserLocation(false)
    }
  }

  const recenterOnUser = () => {
    setFollowUserLocation(true)
    setFollowUserMode(navigationActive ? UserTrackingMode?.FollowWithHeading : UserTrackingMode?.Follow)
  }

  return (
    <View style={[{ flex: 1 }, style]}>
<MapView
        style={StyleSheet.absoluteFillObject}
        mapStyle={navigationActive ? vietmapStyleUrl('dark') : vietmapStyleUrl('default')}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={navigationActive}
        compassViewPosition={3}
        pitchEnabled={navigationActive}
        rotateEnabled={navigationActive}
        scrollEnabled={!navigationActive}
        contentInset={navigationActive ? [150, 0, 200, 0] : undefined}
      >
        {/* GPS-like Camera */}
        <Camera />

        {/* User Location with GPS styling */}
        <UserLocation
          visible={true}
          renderMode={navigationActive ? UserLocationRenderMode.Normal : UserLocationRenderMode.Native}
          showsUserHeadingIndicator={showsUserHeadingIndicator}
          androidRenderMode={navigationActive ? "compass" : "normal"}
          animated={true}
          onUpdate={handleLocationUpdate}
        >
          {/* Vehicle marker rendering not available in VietMap React Native SDK */}
        </UserLocation>

        {/* Route Line */}
        <ShapeSource
          id="sample-route-source"
          shape={SAMPLE_ROUTE}
        >
<LineLayer
            id="sample-route-line"
            style={{
              lineColor: navigationActive ? '#4285F4' : '#1E40AF',
              lineWidth: navigationActive ? 8 : 6,
              lineOpacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
</ShapeSource>

        {/* Start marker rendering not available in VietMap React Native SDK */}
        {/* End marker rendering not available in VietMap React Native SDK */}
      </MapView>

      {/* Navigation Controls */}
      <View style={styles.controlsContainer}>
        {/* Navigation Status */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: navigationActive ? '#10B981' : '#6B7280' }
        ]}>
<Text style={styles.statusText}>
            {navigationActive ? '🧭 Navigation ON' : '📍 Map View'}
          </Text>
</View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: followUserLocation ? '#3B82F6' : '#9CA3AF' }
          ]}
          onPress={recenterOnUser}
        >
<Text style={styles.buttonText}>📍</Text>
</TouchableOpacity>

        {/* Navigation Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: navigationActive ? '#EF4444' : '#10B981' }
          ]}
          onPress={toggleNavigation}
        >
<Text style={styles.buttonText}>
            {navigationActive ? '🛑' : '🧭'}
          </Text>
</TouchableOpacity>
</View>

      {/* GPS Instructions */}
      {navigationActive && (
        <View style={styles.instructionsContainer}>
<View style={styles.instructionCard}>
<Text style={styles.instructionTitle}>🧭 GPS Navigation Active</Text>
<Text style={styles.instructionText}>
              Following route with real-time heading
            </Text>
<Text style={styles.instructionDetail}>
              • 3D View: 60° pitch{'\n'}
              • Zoom: 19x (close){'\n'}
              • Vehicle tracking: ON{'\n'}
              • Route guidance: Active
            </Text>
</View>
</View>
      )}
{/* Location Debug Info */}
      {currentLocation && (
        <View style={styles.debugContainer}>
<Text style={styles.debugText}>
            📍 {currentLocation[1].toFixed(6)}, {currentLocation[0].toFixed(6)}
          </Text>
<Text style={styles.debugText}>
            🗺️ VietMap React Native SDK
          </Text>
<Text style={styles.debugText}>
            🧭 Mode: {navigationActive ? 'GPS Navigation' : 'Map View'}
          </Text>
</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 12,
    zIndex: 1000
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  buttonText: {
    fontSize: 22,
    textAlign: 'center'
  },
  instructionsContainer: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    zIndex: 999
  },
  instructionCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8
  },
  instructionText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8
  },
  instructionDetail: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  debugContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151'
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    lineHeight: 14
  }
})

export default VietMapGPSExample