import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native'
import type { Feature, LineString, Position } from 'geojson'
import { vietmapStyleUrl } from '@/config/vietmap'

let VietmapGL: any, MapView: any, Camera: any, ShapeSource: any, LineLayer: any
let UserLocation: any = null
let UserTrackingMode: any = {}
let UserLocationRenderMode: any = {}
let LocationManager: any = {}

if (Platform.OS !== 'web') {
  VietmapGL = require('@vietmap/vietmap-gl-react-native').default
  const VietMapModule = require('@vietmap/vietmap-gl-react-native')
  MapView = VietMapModule.MapView
  Camera = VietMapModule.Camera
  ShapeSource = VietMapModule.ShapeSource
  LineLayer = VietMapModule.LineLayer
  UserLocation = VietmapGL?.UserLocation || null
  UserTrackingMode = VietmapGL?.UserTrackingMode || {}
  UserLocationRenderMode = VietmapGL?.UserLocationRenderMode || {}
  LocationManager = VietmapGL?.LocationManager || {}
}

interface GPSNavigationProps {
  route?: Feature<LineString>
  style?: any
  onLocationUpdate?: (location: Position) => void
  navigationActive?: boolean
  targetCoordinate?: [number, number]
  showInstructions?: boolean
  instructions?: string[]
}

export const GPSNavigation: React.FC<GPSNavigationProps> = ({
  route,
  style,
  onLocationUpdate,
  navigationActive = false,
  targetCoordinate,
  showInstructions = true,
  instructions = []
}) => {
  const [followUserLocation, setFollowUserLocation] = useState(true)
  const [followUserMode, setFollowUserMode] = useState(UserTrackingMode?.FollowWithHeading)
  const [showsUserHeadingIndicator, setShowsUserHeadingIndicator] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<Position | null>(null)
  const [bearing, setBearing] = useState<number>(0)
  const [pitch, setPitch] = useState<number>(navigationActive ? 65 : 0)
  const [zoomLevel, setZoomLevel] = useState<number>(navigationActive ? 18 : 14)
  
  const cameraRef = useRef<any>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (navigationActive) {
      LocationManager?.start()
      setFollowUserLocation(true)
      setFollowUserMode(UserTrackingMode?.FollowWithHeading)
      setShowsUserHeadingIndicator(true)
      setPitch(65) // 3D tilt for navigation
      setZoomLevel(18) // Close zoom for navigation
    } else {
      setFollowUserLocation(false)
      setFollowUserMode(UserTrackingMode?.Follow)
      setShowsUserHeadingIndicator(false)
      setPitch(0)
      setZoomLevel(14)
    }

    return () => {
      if (navigationActive) {
        LocationManager?.stop()
      }
    }
  }, [navigationActive])

  const handleLocationUpdate = (location: any) => {
    if (location?.coords) {
      const position: Position = [location.coords.longitude, location.coords.latitude]
      setCurrentLocation(position)
      
      if (location.coords.heading !== undefined && location.coords.heading >= 0) {
        setBearing(location.coords.heading)
      }
      
      if (onLocationUpdate) {
        onLocationUpdate(position)
      }
    }
  }

  const handleUserTrackingModeChange = (event: any) => {
    console.log('User tracking mode changed:', event.nativeEvent.payload)
    
    if (!event.nativeEvent.payload.followUserLocation) {
      setFollowUserLocation(false)
    }
  }

  const recenterOnUser = () => {
    setFollowUserLocation(true)
    setFollowUserMode(UserTrackingMode?.FollowWithHeading)
    
    if (cameraRef.current && currentLocation) {
      cameraRef.current.setCamera?.({
        centerCoordinate: currentLocation,
        zoomLevel: navigationActive ? 18 : 16,
        pitch: navigationActive ? 65 : 0,
        heading: bearing,
        animationDuration: 1000
      })
    }
  }

  const toggleNavigationMode = () => {
    const newNavActive = !navigationActive
    
    if (newNavActive) {
      Alert.alert(
        '🧭 Chế độ dẫn đường GPS',
        'Bật chế độ dẫn đường 3D:\n\n' +
        '📍 Theo dõi vị trí: BẬT\n' +
        '🧭 Theo dõi hướng: BẬT\n' +
        '📐 Góc nghiêng 3D: 65°\n' +
        '🔍 Zoom: 18x (gần)\n\n' +
        'Giống như Google Maps/Apple Maps',
        [{ text: 'OK' }]
      )
    }
  }

  // Create target marker if coordinate provided
  const targetMarker = targetCoordinate ? {
    type: 'Feature' as const,
    properties: { type: 'target' },
    geometry: {
      type: 'Point' as const,
      coordinates: targetCoordinate
    }
  } : null

  return (
    <View style={[{ flex: 1 }, style]}>
<MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapStyle={navigationActive ? vietmapStyleUrl('dark') : vietmapStyleUrl('default')}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={navigationActive}
        compassViewPosition={3} // Bottom right
        pitchEnabled={navigationActive}
        rotateEnabled={navigationActive}
        scrollEnabled={!followUserLocation}
        zoomEnabled={true}
        contentInset={navigationActive ? [100, 0, 200, 0] : undefined}
      >
        {/* Camera with GPS-like behavior */}
        <Camera />

        {/* User Location - GPS dot with vehicle icon */}
        <UserLocation
          visible={true}

          showsUserHeadingIndicator={showsUserHeadingIndicator}
          androidRenderMode={navigationActive ? "compass" : "normal"}
          animated={true}
          onUpdate={handleLocationUpdate}
        >
          {/* Vehicle marker rendering not available in VietMap React Native SDK */}
        </UserLocation>

        {/* Route line */}
        {route && (
          <ShapeSource
            id="navigation-route-source"
            shape={route}
          >
<LineLayer
              id="navigation-route-line"
              style={{
                lineColor: navigationActive ? '#4285F4' : '#1E40AF',
                lineWidth: navigationActive ? 8 : 6,
                lineOpacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
</ShapeSource>
        )}
{/* Target marker rendering not available in VietMap React Native SDK */}
      </MapView>

      {/* Navigation Controls */}
      <View 
        style={styles.controlsContainer}
        accessible={true}
        accessibilityLabel="Điều khiển bản đồ"
      >
        {/* GPS Status Indicator */}
        <View 
          style={[
            styles.statusBadge,
            { backgroundColor: navigationActive ? '#10B981' : '#6B7280' }
          ]}
          accessible={true}
          accessibilityLabel={navigationActive ? 'Chế độ dẫn đường GPS đang bật' : 'Chế độ xem bản đồ'}
        >
<Text style={styles.statusText}>
            {navigationActive ? '🧭 GPS Navigation' : '📍 Map View'}
          </Text>
</View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: followUserLocation ? '#3B82F6' : '#9CA3AF' }
          ]}
          onPress={recenterOnUser}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={followUserLocation ? 'Đang theo dõi vị trí' : 'Căn giữa vị trí hiện tại'}
          accessibilityHint="Chạm để căn giữa bản đồ về vị trí hiện tại của bạn"
        >
<Text style={styles.buttonText}>📍</Text>
</TouchableOpacity>

        {/* Navigation Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: navigationActive ? '#EF4444' : '#10B981' }
          ]}
          onPress={toggleNavigationMode}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={navigationActive ? 'Tắt chế độ dẫn đường' : 'Bật chế độ dẫn đường GPS'}
          accessibilityHint={navigationActive ? 'Chạm để tắt dẫn đường GPS' : 'Chạm để bật dẫn đường GPS với góc nhìn 3D'}
        >
<Text style={styles.buttonText}>
            {navigationActive ? '🛑' : '🧭'}
          </Text>
</TouchableOpacity>
</View>

      {/* Instructions Overlay - Only in navigation mode */}
      {navigationActive && showInstructions && instructions.length > 0 && (
        <View 
          style={styles.instructionsContainer}
          accessible={true}
          accessibilityLabel="Hướng dẫn điều hướng"
          accessibilityLiveRegion="polite"
        >
<View 
            style={styles.instructionBubble}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Hướng dẫn: ${instructions[0] || 'Tiếp tục theo tuyến đường'}`}
          >
<Text style={styles.instructionText}>
              {instructions[0] || 'Tiếp tục theo tuyến đường'}
            </Text>
</View>
</View>
      )}
{/* Location Info - Debug overlay */}
      {currentLocation && (
        <View 
          style={styles.debugInfo}
          accessible={false}
          importantForAccessibility="no"
        >
<Text style={styles.debugText}>
            📍 {currentLocation[1].toFixed(6)}, {currentLocation[0].toFixed(6)}
          </Text>
<Text style={styles.debugText}>
            🧭 Bearing: {bearing.toFixed(1)}°
          </Text>
<Text style={styles.debugText}>
            🔍 Zoom: {zoomLevel}x | Pitch: {pitch}°
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  buttonText: {
    fontSize: 20,
    color: '#FFFFFF'
  },
  instructionsContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 999
  },
  instructionBubble: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace'
  }
})

export default GPSNavigation