import React from 'react'
import { View } from 'react-native'

export interface WebRouteMapProps {
  routeData?: string | null
  coordinates?: [number, number][]
  style?: any
  mapboxToken?: string
}

// Native stub: This component is never used on native. It exists only so that
// `import './WebRouteMap'` resolves on iOS/Android while the web build uses
// `WebRouteMap.web.tsx`.
const WebRouteMap: React.FC<WebRouteMapProps> = ({ style }) => {
  return <View style={style} />
}

export default WebRouteMap
