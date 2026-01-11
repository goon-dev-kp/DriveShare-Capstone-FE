import React, { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import type { Position } from 'geojson'

let LineLayer: any, ShapeSource: any
if (Platform.OS !== 'web') {
  const VietMapGL = require('@vietmap/vietmap-gl-react-native')
  LineLayer = VietMapGL.LineLayer
  ShapeSource = VietMapGL.ShapeSource
}

export type TrafficLevel = 'free' | 'moderate' | 'heavy' | 'severe'

interface TrafficSegment {
  coordinates: Position[]
  level: TrafficLevel
  speed: number // km/h
}

interface TrafficLayerProps {
  segments: TrafficSegment[]
  enabled?: boolean
}

const getTrafficColor = (level: TrafficLevel): string => {
  const colors: Record<TrafficLevel, string> = {
    free: '#10B981',      // Green - free flow
    moderate: '#F59E0B',  // Yellow - moderate traffic
    heavy: '#EF4444',     // Red - heavy traffic
    severe: '#991B1B'     // Dark red - severe congestion
  }
  return colors[level]
}

const getTrafficWidth = (level: TrafficLevel): number => {
  const widths: Record<TrafficLevel, number> = {
    free: 3,
    moderate: 4,
    heavy: 5,
    severe: 6
  }
  return widths[level]
}

export const TrafficLayer: React.FC<TrafficLayerProps> = ({
  segments,
  enabled = true
}) => {
  if (!enabled || segments.length === 0) {
    return null
  }

  return (
    <>
      {segments.map((segment, index) => {
        const featureCollection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: segment.coordinates
              },
              properties: {
                level: segment.level,
                speed: segment.speed
              }
            }
          ]
        }

        return (
          <ShapeSource
            key={`traffic-segment-${index}`}
            id={`trafficSegmentSource${index}`}
            shape={featureCollection}
          >
<LineLayer
              id={`trafficSegmentLayer${index}`}
              style={{
                lineColor: getTrafficColor(segment.level),
                lineWidth: getTrafficWidth(segment.level),
                lineOpacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
</ShapeSource>
        )
      })}
    </>
  )
}

/**
 * Mock traffic data generator for testing
 * In production, this would fetch from VietMap Traffic API
 */
export const generateMockTrafficData = (routeCoords: Position[]): TrafficSegment[] => {
  if (routeCoords.length < 2) return []

  const segments: TrafficSegment[] = []
  const segmentSize = Math.max(Math.floor(routeCoords.length / 5), 2)

  for (let i = 0; i < routeCoords.length - 1; i += segmentSize) {
    const end = Math.min(i + segmentSize, routeCoords.length)
    const coords = routeCoords.slice(i, end)
    
    // Random traffic level for demo
    const random = Math.random()
    let level: TrafficLevel = 'free'
    let speed = 50

    if (random < 0.6) {
      level = 'free'
      speed = 50
    } else if (random < 0.8) {
      level = 'moderate'
      speed = 30
    } else if (random < 0.95) {
      level = 'heavy'
      speed = 15
    } else {
      level = 'severe'
      speed = 5
    }

    segments.push({ coordinates: coords, level, speed })
  }

  return segments
}

export default TrafficLayer
export type { TrafficSegment }
