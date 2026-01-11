import React, { useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native'
import Constants from 'expo-constants'
import type { Feature, LineString, Position } from 'geojson'
import { decodePolyline, toGeoJSONLineFeature } from '@/utils/polyline'
import { computeBounds, ensureMinPadding } from '@/utils/map'
import RouteLayer from './RouteLayer'
import PulseCircleLayer from './PulseCircleLayer'
import { getCameraConfigForRoute, addPaddingToBounds } from '@/utils/mapHelpers'

// Import VietMap React Native SDK components (only on native platforms)
let VietmapGL: any = null
if (Platform.OS !== 'web') {
  try {
    VietmapGL = require('@vietmap/vietmap-gl-react-native')
  } catch (error) {
    console.warn('VietMap React Native SDK not available:', error)
  }
}

export interface NativeRouteMapProps {
  routeData?: string | null
  coordinates?: [number, number][]
  style?: any
  styleURL?: string
  padding?: { top?: number; bottom?: number; left?: number; right?: number }
  loadingText?: string
  precision?: number
  showUserLocation?: boolean
  followUserLocation?: boolean
  followZoomLevel?: number
  followPitch?: number // 3D tilt angle (0-60 degrees)
  followBearing?: number // Compass rotation (0-360 degrees)
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
  currentMarker?: [number, number]
  navigationActive?: boolean
  onUserTrackingModeChange?: (followUserLocation: boolean) => void
  progressFeature?: Feature<LineString> | null
  pulseMarker?: [number, number]
  waypoints?: Array<{ coordinate: [number, number]; label: string; description?: string }>
  onWaypointPress?: (waypoint: { coordinate: [number, number]; label: string; description?: string }) => void
  enableSmoothing?: boolean
}

interface MemoRoute {
  feature: Feature<LineString> | null
  start: Position | null
  end: Position | null
  bounds: { sw: Position; ne: Position } | null
}

const NativeRouteMap: React.FC<NativeRouteMapProps> = ({
  routeData,
  coordinates,
  style,
  styleURL,
  padding,
  loadingText = 'Đang tải tuyến đường...',
  precision = 5,
  showUserLocation = false,
  followUserLocation = false,
  followZoomLevel,
  followPitch,
  followBearing,
  userMarkerPosition,
  userMarkerBearing,
  startMarker,
  endMarker,
  showOverviewMarkers,
  currentMarker,
  navigationActive = false,
  onUserTrackingModeChange,
  progressFeature,
  pulseMarker,
  waypoints,
  onWaypointPress,
  enableSmoothing = true
}) => {
  const cameraRef = useRef<any>(null)
  const { feature, bounds, start, end } = useMemo<MemoRoute>(() => {
    try {
      let coords: [number, number][] = coordinates || []
      if ((!coords || coords.length === 0) && routeData) {
        coords = decodePolyline(routeData, precision).coordinates
      }
      if (!coords || coords.length === 0) return { feature: null, start: null, end: null, bounds: null }
      const feature = toGeoJSONLineFeature(coords) as Feature<LineString>
      const b = computeBounds(coords)
      return { feature, bounds: b, start: coords[0], end: coords[coords.length - 1] }
    } catch (e) {
      console.warn('NativeRouteMap decode error', e)
      return { feature: null, start: null, end: null, bounds: null }
    }
  }, [routeData, coordinates, precision])

  const isExpoGo = Constants?.appOwnership === 'expo'
  if (isExpoGo || !VietmapGL) {
    return (
      <View style={[styles.container, style, styles.center]}>
<Text style={{ color: '#6B7280', textAlign: 'center', paddingHorizontal: 16 }}>
          VietMap native SDK cần development build. Vui lòng chạy: eas build --profile development --platform android
        </Text>
</View>
    )
  }

  // Android runtime location permission if user location is requested
  useEffect(() => {
    if (Platform.OS !== 'android' || !VietmapGL) return
    if (!showUserLocation && !followUserLocation) return
    try {
      // VietMap handles permissions internally
      VietmapGL.requestAndroidLocationPermissions?.()
    } catch {}
  }, [showUserLocation, followUserLocation])

  // VietMap handles location updates internally when showUserLocation is enabled
  useEffect(() => {
    if (!VietmapGL) return
    // Initialize VietMap GL
    VietmapGL.setAccessToken?.(process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY || 'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a')
  }, [])

  if (!feature || !bounds) {
    return (
      <View style={[styles.container, style, styles.center]}>
        {routeData ? <ActivityIndicator size='large' color='#2563EB' /> : <Text>{loadingText}</Text>}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
<VietmapGL.MapView
        style={styles.map}
        styleURL={styleURL || `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY}`}
        logoEnabled={true}
        compassEnabled
        rotateEnabled
        pitchEnabled={navigationActive}
      >
        {followUserLocation ? (
          <VietmapGL.Camera
            followUserLocation
            followUserMode={navigationActive ? "compass" : "normal"}
            zoomLevel={followZoomLevel ?? (navigationActive ? 19.5 : 17)}
            pitch={followPitch ?? (navigationActive ? 65 : 55)}
            heading={followBearing}
            animationDuration={300}
            animationMode="easeTo"
          />
        ) : (
          <VietmapGL.Camera
            bounds={{ ne: bounds.ne, sw: bounds.sw }}
            padding={ensureMinPadding(padding)}
            animationDuration={600}
          />
        )}
        {showUserLocation && navigationActive ? (
          <VietmapGL.UserLocation
            showsUserHeadingIndicator
            minDisplacement={3}
            renderMode="normal"
          />
        ) : null}
        {userMarkerPosition && !navigationActive ? (
          <VietmapGL.PointAnnotation id="driver-car" coordinate={userMarkerPosition} anchor={{ x: 0.5, y: 0.5 }}>
<View style={{ transform: [{ rotate: `${userMarkerBearing ?? 0}deg` }] }}>
<View style={styles.carMarkerOuter}>
<View style={styles.carBody}>
<View style={styles.carRoof} />
<View style={styles.carWheels}>
<View style={styles.wheel} />
<View style={styles.wheel} />
</View>
</View>
</View>
</View>
</VietmapGL.PointAnnotation>
        ) : null}
        {showOverviewMarkers && startMarker ? (
          <VietmapGL.PointAnnotation id="start-pin" coordinate={startMarker} anchor={{ x: 0.5, y: 1.0 }}>
<View style={styles.pinWrap}><Text style={styles.pinText}>A</Text></View>
</VietmapGL.PointAnnotation>
        ) : null}
        {showOverviewMarkers && endMarker ? (
          <VietmapGL.PointAnnotation id="end-pin" coordinate={endMarker} anchor={{ x: 0.5, y: 1.0 }}>
<View style={[styles.pinWrap, { backgroundColor: '#DC2626', borderColor: '#FCA5A5' }]}><Text style={styles.pinText}>B</Text></View>
</VietmapGL.PointAnnotation>
        ) : null}
        {showOverviewMarkers && currentMarker ? (
          <VietmapGL.PointAnnotation id="current-pin" coordinate={currentMarker} anchor={{ x: 0.5, y: 1.0 }}>
<View style={[styles.pinWrap, { backgroundColor: '#111827', borderColor: '#374151' }]}><Text style={styles.pinText}>Bạn</Text></View>
</VietmapGL.PointAnnotation>
        ) : null}
        {/* Waypoint markers */}
        {waypoints && waypoints.map((waypoint, index) => (
          <VietmapGL.PointAnnotation
            key={`waypoint-${index}`}
            id={`waypoint-${index}`}
            coordinate={waypoint.coordinate}
            anchor={{ x: 0.5, y: 1.0 }}
            onSelected={() => onWaypointPress?.(waypoint)}
          >
<View style={styles.waypointWrap}>
<Text style={styles.waypointNumber}>{index + 1}</Text>
</View>
            {waypoint.label && (
              <View style={styles.waypointLabel}>
<Text style={styles.waypointLabelText}>{waypoint.label}</Text>
</View>
            )}
          </VietmapGL.PointAnnotation>
        ))}
        {pulseMarker ? (
          <PulseCircleLayer 
            shape={{ type: 'Point', coordinates: pulseMarker }}
            aboveLayerID="routeLine"
          />
        ) : null}
        <RouteLayer 
          feature={feature} 
          start={start} 
          end={end}
          progressFeature={progressFeature}
          useGradient={navigationActive}
        />
</VietmapGL.MapView>
</View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 300, backgroundColor: '#f8f8f8' },
  map: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  carMarkerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  carEmoji: { fontSize: 20 },
  carBody: {
    width: 22,
    height: 12,
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  carRoof: {
    position: 'absolute',
    top: -6,
    width: 12,
    height: 6,
    backgroundColor: '#1D4ED8',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },
  carWheels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: -4
  },
  wheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151'
  },
  pinWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  pinText: { color: '#FFFFFF', fontWeight: '800' },
  waypointWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  waypointNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  waypointLabel: {
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  waypointLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  }
})


export default NativeRouteMap
