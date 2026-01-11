import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, Alert, Platform } from 'react-native'
import type { Feature, LineString, Position } from 'geojson'

let VietmapGL: any, MapView: any, Camera: any, ShapeSource: any, LineLayer: any, PointAnnotation: any
let UserLocation: any = null
let UserTrackingMode: any = {}
let UserLocationRenderMode: any = {}

if (Platform.OS !== 'web') {
  VietmapGL = require('@vietmap/vietmap-gl-react-native').default
  const VietMapModule = require('@vietmap/vietmap-gl-react-native')
  MapView = VietMapModule.MapView
  Camera = VietMapModule.Camera
  ShapeSource = VietMapModule.ShapeSource
  LineLayer = VietMapModule.LineLayer
  PointAnnotation = VietMapModule.PointAnnotation
  UserLocation = VietmapGL?.UserLocation || null
  UserTrackingMode = VietmapGL?.UserTrackingMode || {}
  UserLocationRenderMode = VietmapGL?.UserLocationRenderMode || {}
}
import { vietmapStyleUrl } from '@/config/vietmap'

interface VietMapNativeRouteMapProps {
  coordinates: [number, number][]
  style?: any
  styleURL?: string
  showUserLocation?: boolean
  followUserLocation?: boolean
  followZoomLevel?: number
  followPitch?: number
  followBearing?: number
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  navigationActive?: boolean
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
  pulseMarker?: [number, number]
  progressFeature?: Feature<LineString>
  onLocationUpdate?: (location: Position) => void
  routes?: Array<{
    id: string
    coordinates: [number, number][]
    color: string
    label: string
    visible: boolean
  }>
  onRouteSelect?: (routeId: string) => void
  selectedRouteId?: string
}

export const VietMapNativeRouteMap: React.FC<VietMapNativeRouteMapProps> = ({
  coordinates = [],
  style,
  styleURL = vietmapStyleUrl('default'),
  showUserLocation = true,
  followUserLocation = false,
  followZoomLevel = 16,
  followPitch = 0,
  followBearing = 0,
  userMarkerPosition,
  userMarkerBearing = 0,
  navigationActive = false,
  startMarker,
  endMarker,
  showOverviewMarkers = true,
  pulseMarker,
  progressFeature,
  onLocationUpdate,
  routes = [],
  onRouteSelect,
  selectedRouteId
}) => {
  const mapRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [internalUserFeature, setInternalUserFeature] = useState<any | null>(null)

  // Create route feature from coordinates
  const createRouteFeature = useCallback((coords: [number, number][]): Feature<LineString> | null => {
    if (!coords || coords.length < 2) return null
    
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    }
  }, [])

  // Create marker feature
  const createMarkerFeature = useCallback((coord: [number, number], type: string): Feature => {
    return {
      type: 'Feature',
      properties: { type },
      geometry: {
        type: 'Point',
        coordinates: coord
      }
    }
  }, [])

  // Handle map ready
  const handleMapReady = useCallback(() => {
    console.log('🗺️ VietMap Native SDK loaded')
    setMapLoaded(true)
  }, [])

  // Handle user location update
  const handleLocationUpdate = useCallback((location: any) => {
    if (onLocationUpdate && location?.coords) {
      const position: Position = [location.coords.longitude, location.coords.latitude]
      onLocationUpdate(position)
    }
  }, [onLocationUpdate])

  // Keep an internal GeoJSON point for the user's location so we can render a PointAnnotation
  useEffect(() => {
    if (userMarkerPosition && Array.isArray(userMarkerPosition)) {
      setInternalUserFeature({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: userMarkerPosition }
      })
    } else {
      setInternalUserFeature(null)
    }
  }, [userMarkerPosition])

  // Camera follow behavior: move camera to user marker when navigationActive or followUserLocation
  useEffect(() => {
    const shouldFollow = navigationActive || followUserLocation
    if (!shouldFollow) return
    if (!cameraRef.current) return
    if (!userMarkerPosition || !Array.isArray(userMarkerPosition)) return

    try {
      cameraRef.current.setCamera?.({
        centerCoordinate: userMarkerPosition,
        zoomLevel: followZoomLevel || 16,
        pitch: followPitch || 0,
        heading: typeof userMarkerBearing === 'number' ? userMarkerBearing : followBearing || 0,
        animationDuration: 500
      })
    } catch (e) {
      // Some runtimes may not expose setCamera; ignore gracefully
      console.warn('Native camera set failed:', e)
    }
  }, [userMarkerPosition, userMarkerBearing, navigationActive, followUserLocation, followZoomLevel, followPitch, followBearing])

  // Handle route layer press for route selection
  const handleRoutePress = useCallback((event: any) => {
    if (!onRouteSelect) return
    
    const features = event?.nativeEvent?.payload?.features
    if (features && features.length > 0) {
      const routeId = features[0]?.properties?.routeId
      if (routeId) {
        onRouteSelect(routeId)
      }
    }
  }, [onRouteSelect])

  // Create main route feature
  const routeFeature = createRouteFeature(coordinates)
  
  // Create start/end marker features
  const startMarkerFeature = startMarker ? createMarkerFeature(startMarker, 'start') : null
  const endMarkerFeature = endMarker ? createMarkerFeature(endMarker, 'end') : null
  const pulseMarkerFeature = pulseMarker ? createMarkerFeature(pulseMarker, 'pulse') : null

  return (
    <View style={[{ flex: 1 }, style]}>
<MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapStyle={styleURL}
        onDidFinishLoadingMap={handleMapReady}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={navigationActive}
        compassViewPosition={3} // Bottom right
        pitchEnabled={navigationActive}
        rotateEnabled={navigationActive}
        scrollEnabled={!navigationActive} // Disable scrolling during navigation
        zoomEnabled={true}
        contentInset={navigationActive ? [100, 0, 200, 0] : undefined}
        onPress={handleRoutePress}
      >
        {/* Camera with GPS-like following */}
        <Camera ref={cameraRef} />

        {/* User Location - GPS dot */}
        {showUserLocation && UserLocation && (
          <UserLocation
            visible={true}
            showsUserHeadingIndicator={navigationActive}
            animated={true}
            onUpdate={handleLocationUpdate}
          >
            {/* Custom circle marker not available in VietMap React Native SDK */}
          </UserLocation>
        )}
        {/* Rotating vehicle marker (native) - uses PointAnnotation so we can render a React Native view */}
        {internalUserFeature && (
          <PointAnnotation
            id="user-marker"
            coordinate={internalUserFeature.geometry.coordinates as [number, number]}
          >
            <View style={[styles.userMarkerContainer, { transform: [{ rotate: `${userMarkerBearing || 0}deg` }] }]}>
              <View style={styles.userMarker} />
              <View style={styles.userMarkerHeading} />
            </View>
          </PointAnnotation>
        )}
{/* Multiple Route Layers - Separate clickable routes */}
        {routes.map((route, index) => {
          if (!route.visible || !route.coordinates || route.coordinates.length < 2) return null
          
          const routeFeature = createRouteFeature(route.coordinates)
          if (!routeFeature) return null
          
          return (
            <ShapeSource
              key={`route-${route.id}`}
              id={`route-source-${route.id}`}
              shape={{
                ...routeFeature,
                properties: { 
                  routeId: route.id,
                  selected: selectedRouteId === route.id
                }
              }}
              onPress={handleRoutePress}
            >
<LineLayer
                id={`route-line-${route.id}`}
                style={{
                  lineColor: selectedRouteId === route.id ? '#FF6B35' : route.color,
                  lineWidth: selectedRouteId === route.id ? 6 : 4,
                  lineOpacity: route.visible ? 1 : 0.3,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Route label rendering not available in VietMap React Native SDK */}
            </ShapeSource>
          )
        })}
{/* Main Route Line */}
        {routeFeature && routes.length === 0 && (
          <ShapeSource id="main-route-source" shape={routeFeature}>
<LineLayer
              id="main-route-line"
              style={{
                lineColor: navigationActive ? '#4285F4' : '#1E40AF',
                lineWidth: navigationActive ? 6 : 4,
                lineOpacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
</ShapeSource>
        )}
{/* Progress Feature - Traveled path */}
        {progressFeature && navigationActive && (
          <ShapeSource id="progress-source" shape={progressFeature}>
<LineLayer
              id="progress-line"
              style={{
                lineColor: '#10B981', // Green for completed
                lineWidth: 8,
                lineOpacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
</ShapeSource>
        )}
{/* Start marker rendering not available in VietMap React Native SDK */}
        {/* End marker rendering not available in VietMap React Native SDK */}
        {/* Pulse marker rendering not available in VietMap React Native SDK */}
      </MapView>
</View>
  )
}

const styles = StyleSheet.create({
  userMarkerContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'none'
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  userMarkerHeading: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 12,
    backgroundColor: '#064E3B',
    borderRadius: 2,
    opacity: 0.95
  }
})

export default VietMapNativeRouteMap