import React from 'react'
import { Platform } from 'react-native'
import type { Feature, LineString } from 'geojson'
import NativeRouteMap, { type NativeRouteMapProps } from './NativeRouteMap'
import WebRouteMap from './WebRouteMap.web'

export interface RouteMapProps extends NativeRouteMapProps {
  routeData?: string | null
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  followPitch?: number
  followBearing?: number
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
  currentMarker?: [number, number]
  navigationActive?: boolean
  onUserTrackingModeChange?: (followUserLocation: boolean) => void
  progressFeature?: Feature<LineString> | null
  pulseMarker?: [number, number]
}

export const RouteMap: React.FC<RouteMapProps> = (props) => {
  if (Platform.OS === 'web') {
    // Use WebRouteMap for proper VietMap Web SDK with 3D navigation
    return <WebRouteMap {...props} />
  }
  
  // Use VietMap React Native SDK for mobile platforms (iOS/Android)
  return <NativeRouteMap {...props} />
}



export default RouteMap
