// components/TripMap.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import RouteMap from '@/components/map/RouteMap'
import { vietmapStyleUrl } from '@/config/vietmap'

interface TripMapProps {
  routeData?: string | null
  coordinates?: [number, number][]
  style?: any
  showUserLocation?: boolean
  followUserLocation?: boolean
  followZoomLevel?: number
  followPitch?: number
  followBearing?: number
  padding?: { top?: number; bottom?: number; left?: number; right?: number }
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
  currentMarker?: [number, number]
  // Deprecated props maintained for backward compatibility (ignored)
  enableStartButton?: boolean
  cacheKey?: string
  onStartNavigation?: () => void
  onStopNavigation?: () => void
}

// Stateless map wrapper
const TripMap: React.FC<TripMapProps> = ({ routeData, coordinates, style, showUserLocation, followUserLocation, followZoomLevel, followPitch, followBearing, padding, userMarkerPosition, userMarkerBearing, startMarker, endMarker, showOverviewMarkers, currentMarker }) => {
  const styleURL = vietmapStyleUrl('light')
  return (
    <View style={[{ position: 'relative' }, style]}>
<RouteMap
        routeData={routeData}
        coordinates={coordinates}
        style={{ position: 'absolute', inset: 0 } as any}
        styleURL={styleURL}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        followZoomLevel={followZoomLevel}
        followPitch={followPitch}
        followBearing={followBearing}
        padding={padding}
        userMarkerPosition={userMarkerPosition}
        userMarkerBearing={userMarkerBearing}
        startMarker={startMarker}
        endMarker={endMarker}
        showOverviewMarkers={showOverviewMarkers}
        currentMarker={currentMarker}
      />
</View>
  )
}

export default TripMap

const styles = StyleSheet.create({
  // Intentionally minimal; styles retained for backward compatibility if needed later
})