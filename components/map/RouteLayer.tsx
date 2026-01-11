import React from 'react'
import { View, StyleSheet } from 'react-native'
import VietMapGLWrapper from './VietMapGLWrapper'
// VietMap native types may be missing in this environment; use `any` for
// layer style to keep TypeScript checks permissive here.
import type { LineLayerStyle as _LineLayerStyle } from '@vietmap/vietmap-gl-react-native'
import type { Feature, LineString, Position } from 'geojson'

const { ShapeSource, LineLayer, PointAnnotation } = VietMapGLWrapper

export interface RouteLayerProps {
  feature: Feature<LineString>
  start?: Position | null
  end?: Position | null
  lineStyle?: any
  showMarkers?: boolean
  progressFeature?: Feature<LineString> | null
  progressLineStyle?: any
  useGradient?: boolean
}

const defaultLineStyle: any = {
  lineColor: '#CBD5E1',
  lineWidth: 6,
  lineOpacity: 0.5,
  lineJoin: 'round',
  lineCap: 'round'
}

const defaultProgressLineStyle: any = {
  lineColor: '#3B82F6',
  lineWidth: 6,
  lineOpacity: 1,
  lineJoin: 'round',
  lineCap: 'round'
}

// Gradient style for progress line with blue gradient
// Note: lineGradient not in type def but works at runtime
const gradientProgressLineStyle = {
  lineColor: '#3B82F6',
  lineWidth: 6,
  lineOpacity: 1,
  lineJoin: 'round',
  lineCap: 'round',
  lineGradient: [
    'interpolate',
    ['linear'],
    ['line-progress'],
    0,
    '#4264fb',
    0.3,
    '#314ccd',
    0.6,
    '#2563eb',
    1,
    '#1e40af',
  ]
} as any

export const RouteLayer: React.FC<RouteLayerProps> = ({ 
  feature, 
  start, 
  end, 
  lineStyle, 
  showMarkers = true,
  progressFeature,
  progressLineStyle,
  useGradient = true
}) => {
  return (
    <>
      {/* Base route line (gray, semi-transparent) */}
      <ShapeSource id='routeSource' shape={feature}>
<LineLayer id='routeLine' style={lineStyle || defaultLineStyle} />
</ShapeSource>
      
      {/* Progress line with gradient (blue gradient or solid green) */}
      {progressFeature && (
        <ShapeSource 
          id='progressSource' 
          shape={progressFeature}
          lineMetrics={useGradient}
        >
<LineLayer 
            id='progressLine' 
            style={
              progressLineStyle || 
              (useGradient ? gradientProgressLineStyle : defaultProgressLineStyle)
            }
          />
</ShapeSource>
      )}
{/* Start/End markers */}
      {showMarkers && start && (
        <PointAnnotation id='routeStart' coordinate={start}>
<View style={[styles.marker, styles.start]} />
</PointAnnotation>
      )}
      {showMarkers && end && (
        <PointAnnotation id='routeEnd' coordinate={end}>
<View style={[styles.marker, styles.end]} />
</PointAnnotation>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff'
  },
  start: { backgroundColor: '#16A34A' },
  end: { backgroundColor: '#DC2626' }
})

export default RouteLayer
