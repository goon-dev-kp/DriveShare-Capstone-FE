import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Button, Text } from 'react-native'
import RouteMap from './RouteMap'
import NavigationHUD from '@/components/map/NavigationHUD'
import { RouteSimulator } from '@/utils/RouteSimulator'
import { toGeoJSONLineFeature } from '@/utils/polyline'
import type { Feature, LineString } from 'geojson'

/**
 * Example: Sử dụng RouteMap với Navigation Mode và RouteSimulator
 * 
 * Component này minh họa cách:
 * 1. Hiển thị route trên map
 * 2. Bật chế độ navigation
 * 3. Mô phỏng di chuyển với RouteSimulator
 * 4. Hiển thị progress line và pulse marker
 * 5. Hiển thị NavigationHUD với thông tin ETA, distance
 */

// Example route: Hà Nội - Đường vòng quanh Hồ Gươm
const DEMO_ROUTE_COORDINATES: [number, number][] = [
  [105.85189, 21.02893], // Điểm A - Trước nhà hát lớn
  [105.85247, 21.02802],
  [105.85295, 21.02711],
  [105.85265, 21.02643],
  [105.85183, 21.02598],
  [105.85089, 21.02581],
  [105.84989, 21.02598],
  [105.84905, 21.02643],
  [105.84875, 21.02711],
  [105.84923, 21.02802],
  [105.84981, 21.02893],
  [105.85065, 21.02958],
  [105.85159, 21.02975],
  [105.85189, 21.02893]  // Điểm B - Quay lại gần điểm A
]

const NavigationExample: React.FC = () => {
  const [navigationActive, setNavigationActive] = useState(false)
  const [progressFeature, setProgressFeature] = useState<Feature<LineString> | null>(null)
  const [currentPoint, setCurrentPoint] = useState<any>(null)
  const [eta, setEta] = useState<string>('--:--')
  const [remainingDistance, setRemainingDistance] = useState<string>('-- km')
  const [nextInstruction, setNextInstruction] = useState<string>('')

  useEffect(() => {
    if (!navigationActive) {
      setProgressFeature(null)
      setCurrentPoint(null)
      return
    }

    const routeFeature = toGeoJSONLineFeature(DEMO_ROUTE_COORDINATES)
    const simulator = new RouteSimulator(routeFeature, 0.05) // Speed 0.05 km/tick

    simulator.addListener((point) => {
      setCurrentPoint(point)
      
      // Tạo progress line từ điểm đầu đến điểm hiện tại
      const { nearestIndex, distance } = point.properties
      const totalDistance = (routeFeature.geometry.coordinates.length - 1) * 0.2 // Rough estimate
      
      // Update progress line
      const progressCoords = DEMO_ROUTE_COORDINATES
        .filter((_, i) => i <= nearestIndex)
        .concat([point.geometry.coordinates as [number, number]])
      
      if (progressCoords.length >= 2) {
        setProgressFeature(toGeoJSONLineFeature(progressCoords))
      }

      // Calculate ETA (giả định tốc độ 30 km/h)
      const remaining = Math.max(0, totalDistance - distance)
      setRemainingDistance(`${remaining.toFixed(1)} km`)
      
      const avgSpeed = 30 // km/h
      const hoursRemaining = remaining / avgSpeed
      const now = new Date()
      const etaTime = new Date(now.getTime() + hoursRemaining * 3600000)
      setEta(etaTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))

      // Simulate instruction changes based on progress
      if (nearestIndex < 3) {
        setNextInstruction('Tiếp tục đi thẳng theo đường Tràng Tiền')
      } else if (nearestIndex < 7) {
        setNextInstruction('Rẽ trái tại ngã tư tiếp theo')
      } else if (nearestIndex < 11) {
        setNextInstruction('Rẽ phải theo hướng về điểm đến')
      } else {
        setNextInstruction('Bạn sắp đến nơi')
      }
    })

    simulator.start()
    return () => simulator.stop()
  }, [navigationActive])

  const handleToggleNavigation = () => {
    setNavigationActive((prev) => !prev)
  }

  const handleUserTrackingModeChange = (following: boolean) => {
    if (!following && navigationActive) {
      // User manually stopped tracking, turn off navigation
      setNavigationActive(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Control Panel */}
      <View style={styles.controls}>
<Button
          title={navigationActive ? 'Dừng Navigation' : 'Bắt đầu Navigation'}
          onPress={handleToggleNavigation}
          color={navigationActive ? '#DC2626' : '#16A34A'}
        />
<Text style={styles.hint}>
          {navigationActive 
            ? '🚗 Chế độ navigation đang hoạt động' 
            : 'Nhấn nút để bắt đầu mô phỏng'}
        </Text>
</View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {navigationActive && (
          <NavigationHUD
            eta={eta}
            remainingDistance={remainingDistance}
            currentSpeed="30 km/h"
            nextInstruction={nextInstruction}
            distanceToNextInstruction={currentPoint ? `${(0.2 - (currentPoint.properties.distance % 0.2)).toFixed(0)}m` : '...'}
            visible={navigationActive}
          />
        )}
        
        <RouteMap
          coordinates={DEMO_ROUTE_COORDINATES}
          navigationActive={navigationActive}
          followUserLocation={navigationActive}
          followZoomLevel={navigationActive ? 18 : 15}
          followPitch={navigationActive ? 60 : 45}
          progressFeature={progressFeature}
          pulseMarker={currentPoint?.geometry.coordinates}
          startMarker={DEMO_ROUTE_COORDINATES[0]}
          endMarker={DEMO_ROUTE_COORDINATES[DEMO_ROUTE_COORDINATES.length - 1]}
          showOverviewMarkers={!navigationActive}
          onUserTrackingModeChange={handleUserTrackingModeChange}
          style={styles.map}
        />
</View>

      {/* Info Panel */}
      {!navigationActive && (
        <View style={styles.infoPanel}>
<Text style={styles.infoTitle}>📍 Demo Route</Text>
<Text style={styles.infoText}>
            Tuyến đường mẫu: Vòng quanh Hồ Gươm, Hà Nội
          </Text>
<Text style={styles.infoText}>
            • RouteSimulator với speed 0.05 km/tick
          </Text>
<Text style={styles.infoText}>
            • PulseCircleLayer cho vị trí hiện tại
          </Text>
<Text style={styles.infoText}>
            • Progress line màu xanh lá
          </Text>
</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  controls: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  infoPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20
  }
})

export default NavigationExample
