import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import * as Speech from 'expo-speech'

// Safely import map components with error handling
let VietMapUniversal: any = null
let GPSNavigation: any = null
let NavigationHUD: any = null
let ZoomControls: any = null
let VehicleMarker: any = null
let NativeRouteMap: any = null
let GradientRouteLayer: any = null
let RouteSelectionPanel: any = null

try {
  VietMapUniversal = require('../../components/map/VietMapUniversal').default
  const gpsNav = require('../../components/map/GPSNavigation')
  GPSNavigation = gpsNav.GPSNavigation || gpsNav.default
  NavigationHUD = require('../../components/map/NavigationHUD').default
  ZoomControls = require('../../components/map/ZoomControls').default
  const vehicleMarker = require('../../components/map/VehicleMarker')
  VehicleMarker = vehicleMarker.VehicleMarker || vehicleMarker.default
  NativeRouteMap = require('../../components/map/NativeRouteMap').default
  const gradientRoute = require('../../components/map/GradientRouteLayer')
  GradientRouteLayer = gradientRoute.GradientRouteLayer || gradientRoute.default
  const routePanel = require('../../components/map/RouteSelectionPanel')
  RouteSelectionPanel = routePanel.RouteSelectionPanel || routePanel.default
} catch (error) {
  console.warn('⚠️ Some map components failed to load:', error)
}

import vietmapService from '../../services/vietmapService'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

// Demo destinations in Ho Chi Minh City (including some near Vinhomes Grand Park Q9)
const DEMO_DESTINATIONS = [
  {
    id: '1',
    name: 'Suối Tiên Theme Park',
    address: 'Khu du lịch Suối Tiên, Quận 9', 
    coordinates: [106.8518, 10.8501] as [number, number],
    emoji: '🎢',
    description: 'Khu vui chơi giải trí lớn nhất Q9'
  },
  {
    id: '2',
    name: 'Vincom Plaza Xuân Thủy',
    address: 'Xuân Thủy, Thảo Điền, Quận 2',
    coordinates: [106.7348, 10.8032] as [number, number], 
    emoji: '🛍️',
    description: 'Trung tâm thương mại gần Q9'
  },
  {
    id: '3', 
    name: 'Landmark 81',
    address: 'Vinhomes Central Park, Quận Bình Thạnh',
    coordinates: [106.7238, 10.7942] as [number, number],
    emoji: '🏢',
    description: 'Tòa nhà cao nhất Việt Nam'
  },
  {
    id: '4',
    name: 'Bến Thành Market', 
    address: 'Lê Lợi, Phường Bến Thành, Quận 1',
    coordinates: [106.6981, 10.7720] as [number, number],
    emoji: '🏪',
    description: 'Chợ Bến Thành - Trung tâm mua sắm nổi tiếng'
  },
  {
    id: '5',
    name: 'Nguyen Hue Walking Street',
    address: 'Nguyễn Huệ, Quận 1',
    coordinates: [106.7017, 10.7743] as [number, number],
    emoji: '🚶',
    description: 'Phố đi bộ Nguyễn Huệ'
  },
  {
    id: '6',
    name: 'Saigon Hi-Tech Park',
    address: 'Công viên phần mềm, Quận 9',
    coordinates: [106.8072, 10.8500] as [number, number],
    emoji: '🏭',
    description: 'Khu công nghệ cao Sài Gòn'
  }
]

type NavigationMode = 'IDLE' | 'PREPARING' | 'NAVIGATING' | 'COMPLETED'

const NavigationTestScreen: React.FC = () => {
  const router = useRouter()
  
  // Navigation states
  const [mode, setMode] = useState<NavigationMode>('IDLE')
  const [selectedDestination, setSelectedDestination] = useState(DEMO_DESTINATIONS[0])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [permission, setPermission] = useState<any | null>(null)
  
  // Navigation data
  const [speed, setSpeed] = useState<number>(0)
  const [bearing, setBearing] = useState<number>(0)
  const [routeProgress, setRouteProgress] = useState<number>(0)
  const [eta, setEta] = useState<string>('--:--')
  const [currentInstruction, setCurrentInstruction] = useState<string>('')
  const [remainingDistance, setRemainingDistance] = useState<number>(0)
  
  // Route visualization states  
  const [showRouteOptions, setShowRouteOptions] = useState<boolean>(false)
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null)
  const [alternativeRoutes, setAlternativeRoutes] = useState<Array<{
    id: string;
    coordinates: [number, number][];
    color: string;
    label: string;
    visible: boolean;
  }>>([]) 
  const [selectedRouteId, setSelectedRouteId] = useState<string>('main')
  
  // Map controls
  const [zoomLevel, setZoomLevel] = useState<number>(18)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  
  // GPS Navigation states
  const [useGPSNavigation, setUseGPSNavigation] = useState<boolean>(true) // Use GPS component
  const [vehicleBearing, setVehicleBearing] = useState<number>(0)
  
  // Refs
  const locationWatchRef = useRef<any | null>(null)
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
    return () => {
      stopNavigation()
    }
  }, [])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setPermission(status)
      
      if (status === 'granted') {
        getCurrentLocation()
      }
    } catch (error) {
      console.error('❌ Permission error:', error)
      Alert.alert('Lỗi quyền truy cập', 'Không thể lấy quyền truy cập vị trí')
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      })
      
      const coords: [number, number] = [location.coords.longitude, location.coords.latitude]
      setCurrentLocation(coords)
      
      console.log('📍 Current location (Vinhomes Grand Park Q9):', coords)
    } catch (error) {
      console.error('❌ Location error:', error)
      // Fallback to Vinhomes Grand Park, Quận 9 if location fails
      const vinhomesGrandPark: [number, number] = [106.8349, 10.8411]
      setCurrentLocation(vinhomesGrandPark)
      console.log('📍 Using fallback location: Vinhomes Grand Park, Q9')
    }
  }

  const startNavigation = async () => {
    if (!currentLocation) {
      Alert.alert('Lỗi vị trí', 'Không thể xác định vị trí hiện tại')
      return
    }

    setMode('PREPARING')
    
    try {
      // Get real route using VietMap API
      console.log('🗺️ Planning route from Vinhomes Grand Park Q9 to', selectedDestination.name)
      console.log('📍 From:', currentLocation, '→ 📍 To:', selectedDestination.coordinates)
      
      try {
        // Use pickup = destination for simple point-to-point routing  
        const routeResult = await vietmapService.planCurrentToTrip(
          currentLocation, 
          selectedDestination.coordinates, 
          selectedDestination.coordinates
        )
        
        if (routeResult.coordinates && routeResult.coordinates.length > 1) {
          const coords = routeResult.coordinates as [number, number][]
          setRouteCoords(coords)
          
          // Create GeoJSON feature
          const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          }
          setRouteGeoJSON(routeFeature)
          
          // Generate alternative routes for demonstration
          setAlternativeRoutes([
            {
              id: 'main',
              coordinates: coords,
              color: '#3B82F6',
              label: 'Tuyến chính',
              visible: true
            },
            {
              id: 'alternative1',
              coordinates: generateAlternativeRoute(coords, 0.2),
              color: '#10B981',
              label: 'Tuyến phụ 1',
              visible: false
            },
            {
              id: 'alternative2', 
              coordinates: generateAlternativeRoute(coords, -0.2),
              color: '#F59E0B',
              label: 'Tuyến phụ 2',
              visible: false
            }
          ])
          
          console.log('✅ Real VietMap route calculated!')
          console.log('🛣️ Points:', routeResult.coordinates.length)
          console.log('📏 Distance:', routeResult.distance?.toFixed(2), 'km')
          console.log('⏰ Time:', Math.round((routeResult.time || 0) / 60), 'minutes')
          
          // Update estimated distance for better ETA calculation
          if (routeResult.distance) {
            setRemainingDistance(routeResult.distance * 1000) // Convert to meters
          }
        } else {
          throw new Error('VietMap API returned invalid route data')
        }
      } catch (routeError) {
        // Fallback to simple route if API fails
        console.warn('⚠️ VietMap API failed:', routeError)
        console.log('🔄 Using fallback straight-line route')
        
        const route = generateDemoRoute(currentLocation, selectedDestination.coordinates)
        setRouteCoords(route)
        
        // Create GeoJSON feature for fallback route
        const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
        setRouteGeoJSON(routeFeature)
        
        Alert.alert(
          '⚠️ Dẫn đường đơn giản', 
          'Không thể lấy tuyến đường chi tiết. Sử dụng đường thẳng tham khảo.',
          [{ text: 'OK', style: 'default' }]
        )
      }
      
      // Start location tracking
      await startLocationTracking()
      
      // Initialize navigation data
      setRouteProgress(0)
      setCurrentInstruction(`🧭 Bắt đầu điều hướng đến ${selectedDestination.name}`)
      
      // Start navigation
      setMode('NAVIGATING')
      
      // Voice announcement
      try {
        Speech.speak(`Bắt đầu điều hướng đến ${selectedDestination.name}`, { language: 'vi-VN' })
      } catch (e) {
        console.log('TTS not available:', e)
      }
      
      console.log('🚗 Navigation started')
      
    } catch (error) {
      console.error('❌ Navigation start error:', error)
      Alert.alert('Lỗi dẫn đường', 'Không thể bắt đầu dẫn đường')
      setMode('IDLE')
    }
  }

  const stopNavigation = async () => {
    console.log('⏹️ Stopping navigation...')
    
    try {
      // Stop location tracking with proper cleanup
      if (locationWatchRef.current) {
        try {
          if (typeof locationWatchRef.current.remove === 'function') {
            locationWatchRef.current.remove()
          }
        } catch (removeErr) {
          console.warn('⚠️ Error when removing location watcher, attempting safe cleanup:', removeErr)
          try {
            // try alternative removal APIs if present
            if (typeof (locationWatchRef.current as any).removeSubscription === 'function') {
              ;(locationWatchRef.current as any).removeSubscription()
            }
          } catch (altErr) {
            console.warn('⚠️ Alternative watcher cleanup also failed:', altErr)
          }
        } finally {
          locationWatchRef.current = null
        }
      }
      
      // Clear timers
      if (navigationTimerRef.current) {
        clearInterval(navigationTimerRef.current)
        navigationTimerRef.current = null
      }
      
      // Reset states
      setMode('IDLE')
      setRouteProgress(0)
      setSpeed(0)
      setBearing(0)
      setCurrentInstruction('')
      setRemainingDistance(0)
      setEta('--:--')
      
      try {
        Speech.speak('Đã dừng điều hướng', { language: 'vi-VN' })
      } catch (e) {
        console.log('TTS not available:', e)
      }
    } catch (error) {
      console.error('❌ Stop navigation error:', error)
    }
  }

  const startLocationTracking = async () => {
    try {
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1
        },
        (location: any) => {
          const newPos: [number, number] = [location.coords.longitude, location.coords.latitude]
          setCurrentLocation(newPos)
          
          // Update navigation data
          updateNavigationData(location)
          
          console.log('📍 Location update:', newPos)
        }
      )
    } catch (error) {
      console.error('❌ Location tracking error:', error)
    }
  }

  const updateNavigationData = (location: any) => {
    if (!selectedDestination || routeCoords.length === 0) return

    try {
      // Update speed (m/s to km/h)
      let speedKmh = speed
      if (location.coords.speed !== null && location.coords.speed >= 0) {
        speedKmh = location.coords.speed * 3.6
        setSpeed(speedKmh)
      }
      
      // Update bearing for vehicle rotation
      if (location.coords.heading !== null && location.coords.heading >= 0) {
        setBearing(location.coords.heading)
        setVehicleBearing(location.coords.heading) // Set vehicle icon rotation
      }
      
      // Calculate distance to destination
      const currentPos = [location.coords.longitude, location.coords.latitude]
      const destPos = selectedDestination.coordinates
      const distanceToDestKm = calculateDistance(currentPos, destPos)
      setRemainingDistance(distanceToDestKm * 1000) // Convert to meters
      
      // Calculate progress
      const totalDistance = routeCoords.length > 0 ? 
        calculateDistance(routeCoords[0], destPos) : distanceToDestKm
      const progress = Math.max(0, Math.min(100, ((totalDistance - distanceToDestKm) / totalDistance) * 100))
      setRouteProgress(progress)
      
      // Calculate ETA
      if (speedKmh > 5) {
        const etaHours = distanceToDestKm / speedKmh
        const etaMinutes = Math.round(etaHours * 60)
        setEta(etaMinutes < 60 ? `${etaMinutes}p` : `${Math.floor(etaMinutes/60)}h${etaMinutes%60}p`)
      }
      
      // Update instruction
      if (distanceToDestKm < 0.1) { // 100m
        setCurrentInstruction(`🎯 Bạn đã đến ${selectedDestination.name}!`)
        completeNavigation()
      } else if (distanceToDestKm < 0.5) { // 500m
        setCurrentInstruction(`🎯 Gần đến đích - ${Math.round(distanceToDestKm * 1000)}m`)
      } else {
        setCurrentInstruction(`➡️ Tiếp tục đến ${selectedDestination.name} - ${distanceToDestKm.toFixed(1)}km`)
      }
      
    } catch (error) {
      console.error('❌ Navigation data update error:', error)
    }
  }

  const completeNavigation = () => {
    setMode('COMPLETED')
    
    try {
      Speech.speak('Đã đến đích!', { language: 'vi-VN' })
    } catch (e) {
      console.log('TTS not available:', e)
    }
    
    setTimeout(() => {
      stopNavigation()
    }, 3000)
  }

  // Generate demo route with waypoints following major roads
  const generateDemoRoute = (start: [number, number], end: [number, number]): [number, number][] => {
    const waypoints: [number, number][] = [start]
    
    // Add waypoints that follow major roads from Q9 to destinations
    const distance = calculateDistance(start, end)
    const numWaypoints = Math.min(Math.max(Math.floor(distance * 3), 3), 8) // 3-8 waypoints based on distance
    
    // Create a more realistic path that might follow major roads
    for (let i = 1; i < numWaypoints; i++) {
      const fraction = i / numWaypoints
      
      // Basic interpolation with some road-like variation
      let lng = start[0] + (end[0] - start[0]) * fraction
      let lat = start[1] + (end[1] - start[1]) * fraction
      
      // Add variation to simulate following roads (not straight line)
      const variation = 0.001 * Math.sin(fraction * Math.PI * 2) // Sinusoidal variation
      lng += variation * (Math.random() - 0.5)
      lat += variation * (Math.random() - 0.5)
      
      // Ensure coordinates stay within reasonable bounds for HCMC
      lng = Math.max(106.6, Math.min(106.9, lng))
      lat = Math.max(10.7, Math.min(10.9, lat))
      
      waypoints.push([lng, lat])
    }
    
    waypoints.push(end)
    
    console.log('🛣️ Generated fallback route with', waypoints.length, 'waypoints')
    return waypoints
  }

  // Generate alternative route with slight variation
  const generateAlternativeRoute = (baseRoute: [number, number][], variation: number): [number, number][] => {
    return baseRoute.map((coord, index) => {
      if (index === 0 || index === baseRoute.length - 1) return coord // Keep start/end same
      
      // Apply slight variation
      const [lng, lat] = coord
      return [
        lng + variation * 0.001 * Math.sin(index * Math.PI / baseRoute.length),
        lat + variation * 0.001 * Math.cos(index * Math.PI / baseRoute.length)
      ] as [number, number]
    })
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: number[], coord2: number[]): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Route selection handlers
  const handleRouteToggle = () => {
    setShowRouteOptions(!showRouteOptions)
    Alert.alert(
      showRouteOptions ? '🗺️ Chế độ bản đồ đơn giản' : '🗺️ Tùy chọn tuyến đường',
      showRouteOptions 
        ? 'Hiển thị bản đồ cơ bản'
        : 'Hiển thị các tùy chọn tuyến đường khác nhau\n\n' +
          '• 🗺️ Nhiều tuyến đường\n' +
          '• 🎨 Màu sắc khác nhau\n' +
          '• 🔄 Chuyển đổi linh hoạt\n' +
          '• 📄 Hiển thị thông tin chi tiết',
      [{ text: 'OK' }]
    )
  }

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId)
    const selectedRoute = alternativeRoutes.find(r => r.id === routeId)
    if (selectedRoute) {
      setRouteCoords(selectedRoute.coordinates)
      Alert.alert('🗺️ Tuyến đường đã chọn', `Sử dụng ${selectedRoute.label}`)
    }
  }

  const handleRouteVisibilityToggle = (routeId: string) => {
    setAlternativeRoutes(prev => 
      prev.map(route => 
        route.id === routeId 
          ? { ...route, visible: !route.visible }
          : route
      )
    )
  }

  // GPS Navigation location handler
  const handleGPSLocationUpdate = (location: [number, number]) => {
    setCurrentLocation(location)
    console.log('📍 GPS Navigation Update:', location)
  }

  // Toggle between GPS Navigation và VietMapUniversal
  const handleToggleGPSNavigation = () => {
    setUseGPSNavigation(!useGPSNavigation)
    Alert.alert(
      useGPSNavigation ? '🗺️ Chế độ bản đồ thường' : '🧭 Chế độ GPS Navigation',
      useGPSNavigation 
        ? 'Chuyển sang VietMapUniversal cơ bản'
        : 'Chuyển sang GPS Navigation với:\n\n' +
          '• 📍 Camera theo vị trí người dùng\n' +
          '• 🧭 Camera theo hướng di chuyển\n' +
          '• 🚗 Icon xe theo đúng hướng\n' +
          '• 📐 Góc nhìn 3D (65°)\n' +
          '• 🎯 Tracking mode như Google Maps',
      [{ text: 'OK' }]
    )
  }

  // Map control handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 22))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 10))
  }

  const handleRecenter = () => {
    if (currentLocation) {
      setMapCenter([...currentLocation])
      setZoomLevel(18)
    }
  }

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Format speed for display
  const formatSpeed = (kmh: number): string => {
    return `${Math.round(kmh)} km/h`
  }

  const canStartNavigation = (): boolean => {
    return permission === 'granted' && currentLocation !== null && mode === 'IDLE'
  }

  const getStartButtonText = (): string => {
    if (mode === 'PREPARING') return '⏳ Chuẩn bị...'
    if (mode === 'NAVIGATING') return '🧭 Đang dẫn đường'
    if (mode === 'COMPLETED') return '✅ Hoàn thành'
    if (!currentLocation) return '📍 Đang lấy vị trí...'
    if (permission !== 'granted') return '❌ Chưa có quyền truy cập'
    return '🚗 Bắt đầu dẫn đường'
  }

  const renderMap = () => {
    if (useGPSNavigation && mode === 'NAVIGATING' && GPSNavigation) {
      if (Platform.OS === 'web') {
        return (
          <GPSNavigation
            route={routeGeoJSON}
            style={styles.map}
            onLocationUpdate={handleGPSLocationUpdate}
            navigationActive={true}
            showInstructions={true}
            instructions={[currentInstruction]}
          />
        )
      } else if (NativeRouteMap) {
        return (
          <NativeRouteMap
            coordinates={routeCoords}
            style={styles.map}
            navigationActive={true}
            showUserLocation={true}
            followUserLocation={true}
            followZoomLevel={19.5}
            followPitch={65}
            followBearing={vehicleBearing}
            userMarkerPosition={currentLocation}
            userMarkerBearing={vehicleBearing}
            startMarker={routeCoords[0]}
            endMarker={routeCoords[routeCoords.length - 1]}
            showOverviewMarkers={false}
            onUserTrackingModeChange={(following: any) => {
              if (!following) {
                Alert.alert('Theo dõi GPS', 'Đã tắt theo dõi vị trí người dùng')
              }
            }}
          />
        )
      }
    }
    
    // Fallback to VietMapUniversal
    if (VietMapUniversal) {
      return (
        <VietMapUniversal
          coordinates={mode === 'NAVIGATING' ? routeCoords : (currentLocation ? [currentLocation, selectedDestination.coordinates] : [selectedDestination.coordinates])}
          externalLocation={currentLocation}
          style={styles.map}
          showUserLocation={true}
          navigationActive={mode === 'NAVIGATING'}
          onLocationUpdate={(pos: any) => setCurrentLocation(pos)}
          useWebNavigation={mode === 'NAVIGATING'}
          instructions={[currentInstruction]}
          onNavigationComplete={completeNavigation}
        />
      )
    }
    
    // Final fallback - placeholder
    return (
      <View style={[styles.map, styles.mapFallback]}>
        <Text style={styles.mapFallbackText}>🗺️ Map Loading...</Text>
        <Text style={styles.mapFallbackSubtext}>VietMap components not available</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Navigation 3D Test</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {permission === 'granted' ? '📡' : '❌'} GPS
          </Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Route Options Panel */}
        {showRouteOptions && alternativeRoutes.length > 0 && RouteSelectionPanel && (
          <View style={styles.routeOptionsOverlay}>
            <RouteSelectionPanel
              routes={alternativeRoutes}
              selectedRouteId={selectedRouteId}
              onRouteToggle={handleRouteVisibilityToggle}
              onRouteSelect={handleRouteSelect}
              style={styles.routePanel}
            />
          </View>
        )}
        
        {/* Navigation HUD */}
        {mode === 'NAVIGATING' && NavigationHUD && (
          <NavigationHUD
            nextInstruction={currentInstruction}
            distanceToNextInstruction={formatDistance(remainingDistance)}
            remainingDistance={formatDistance(remainingDistance)}
            eta={eta}
            currentSpeed={formatSpeed(speed)}
            visible={true}
          />
        )}
        
        {/* Zoom Controls */}
        {mode === 'NAVIGATING' && ZoomControls && (
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRecenter={handleRecenter}
          />
        )}
        
        {/* Current Location Badge */}
        {currentLocation && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              📍 {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}
            </Text>
          </View>
        )}
        
        {/* Route Info Badge */}
        {showRouteOptions && alternativeRoutes.length > 0 && (
          <View style={styles.routeInfoBadge}>
            <Text style={styles.routeInfoText}>🗺️ ROUTE OPTIONS</Text>
            <Text style={styles.routeInfoText}>{alternativeRoutes.length} routes available</Text>
          </View>
        )}
        
        {/* Navigation Stats */}
        {mode === 'NAVIGATING' && (
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>🚗 {formatSpeed(speed)}</Text>
            <Text style={styles.statsText}>🧭 {bearing.toFixed(0)}°</Text>
            <Text style={styles.statsText}>📊 {routeProgress.toFixed(0)}%</Text>
          </View>
        )}
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Destination Selector */}
        {mode === 'IDLE' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.destinationScroll}
            contentContainerStyle={styles.destinationContent}
          >
            {DEMO_DESTINATIONS.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={[
                  styles.destCard,
                  selectedDestination.id === dest.id && styles.destCardSelected
                ]}
                onPress={() => setSelectedDestination(dest)}
              >
                <Text style={styles.destEmoji}>{dest.emoji}</Text>
                <Text style={styles.destName}>{dest.name}</Text>
                <Text style={styles.destAddress}>{dest.address}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Selected Destination Info */}
        <View style={styles.selectedDestCard}>
          <View style={styles.destHeader}>
            <Text style={styles.destHeaderEmoji}>{selectedDestination.emoji}</Text>
            <View style={styles.destHeaderText}>
              <Text style={styles.destHeaderName}>{selectedDestination.name}</Text>
              <Text style={styles.destHeaderDesc}>{selectedDestination.description}</Text>
            </View>
            {currentLocation && (
              <Text style={styles.destDistance}>
                {calculateDistance(currentLocation, selectedDestination.coordinates).toFixed(1)}km
              </Text>
            )}
          </View>
        </View>
        
        {/* Navigation Mode Controls */}
        {mode === 'NAVIGATING' && (
          <>
            {/* GPS Navigation Mode Toggle */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.gpsButton, useGPSNavigation && styles.gpsButtonActive]}
                onPress={handleToggleGPSNavigation}
              >
                <Text style={[styles.gpsButtonText, useGPSNavigation && styles.gpsButtonTextActive]}>
                  {useGPSNavigation ? '🧭 GPS Navigation' : '🗺️ Map View'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Route Options Toggle */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[styles.routeButton, showRouteOptions && styles.routeButtonActive]}
                onPress={handleRouteToggle}
              >
                <Text style={[styles.routeButtonText, showRouteOptions && styles.routeButtonTextActive]}>
                  {showRouteOptions ? '🗺️ Route Options' : '🗺️ View Routes'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Navigation Controls */}
        <View style={styles.controlsRow}>
          {mode !== 'NAVIGATING' ? (
            <TouchableOpacity
              style={[
                styles.startButton,
                !canStartNavigation() && styles.startButtonDisabled
              ]}
              onPress={startNavigation}
              disabled={!canStartNavigation()}
            >
              {mode === 'PREPARING' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[
                  styles.startButtonText,
                  !canStartNavigation() && styles.startButtonTextDisabled
                ]}>
                  {getStartButtonText()}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopNavigation}
            >
              <Text style={styles.stopButtonText}>⏹️ Dừng dẫn đường</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Debug Info */}
        {__DEV__ && currentLocation && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>🐛 Debug Info:</Text>
            <Text style={styles.debugText}>Mode: {mode} | GPS: {useGPSNavigation ? 'ON' : 'OFF'}</Text>
            <Text style={styles.debugText}>📍 Location: {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}</Text>
            <Text style={styles.debugText}>🚗 Speed: {speed.toFixed(1)} km/h | Vehicle: {vehicleBearing.toFixed(1)}°</Text>
            <Text style={styles.debugText}>🧭 Bearing: {bearing.toFixed(1)}° | Routes: {showRouteOptions ? 'ON' : 'OFF'}</Text>
            <Text style={styles.debugText}>📊 Progress: {routeProgress.toFixed(1)}% | Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>🗺️ Route points: {routeCoords.length}</Text>
            <Text style={styles.debugText}>📏 Remaining: {formatDistance(remainingDistance)}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6'
  },
  backText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '700'
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'System'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  
  // Map styles
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  mapFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6'
  },
  mapFallbackText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8
  },
  mapFallbackSubtext: {
    fontSize: 14,
    color: '#6B7280'
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  statsBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  
  // Route options overlay
  routeOptionsOverlay: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8
  },
  routePanel: {
    borderRadius: 16
  },
  routeInfoBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  routeInfoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  
  // Control panel styles
  controlPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  
  // Destination selector
  destinationScroll: {
    paddingVertical: 16
  },
  destinationContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  destCard: {
    width: 160,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  destCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6'
  },
  destEmoji: {
    fontSize: 24,
    marginBottom: 8
  },
  destName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4
  },
  destAddress: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14
  },
  
  // Selected destination
  selectedDestCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#0EA5E9'
  },
  destHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  destHeaderEmoji: {
    fontSize: 32
  },
  destHeaderText: {
    flex: 1
  },
  destHeaderName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4
  },
  destHeaderDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18
  },
  destDistance: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0EA5E9'
  },
  
  // Control rows
  controlRow: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  controlsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  
  // Buttons
  startButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#34D399',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56
  },
  startButtonDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB'
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'System'
  },
  startButtonTextDisabled: {
    color: '#9CA3AF'
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F87171',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'System'
  },
  
  // GPS Navigation controls
  gpsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA'
  },
  gpsButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399'
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  gpsButtonTextActive: {
    color: '#FFFFFF'
  },
  
  // Route controls
  routeButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A78BFA'
  },
  routeButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24'
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  routeButtonTextActive: {
    color: '#FFFFFF'
  },
  
  // Debug info
  debugInfo: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  debugText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14
  }
})

export default NavigationTestScreen