// import React from 'react'
// import { View, Text, StyleSheet, Platform } from 'react-native'
// import Svg, { Path, Rect, Circle } from 'react-native-svg'

// // Safe loading of VietMap components with platform detection
// let VietMapComponents: any = {}
// let isVietMapAvailable = false

// // VietMap GL React Native SDK chỉ hoạt động trên mobile (iOS/Android)
// // Không hỗ trợ web platform
// if (Platform.OS === 'ios' || Platform.OS === 'android') {
//   try {
//     // Import VietMap SDK components following official documentation
//     const VietMapGL = require('@vietmap/vietmap-gl-react-native')
    
//     VietMapComponents = {
//       MapView: VietMapGL.MapView,
//       Camera: VietMapGL.Camera,
//       UserLocation: VietMapGL.UserLocation,
//       LineLayer: VietMapGL.LineLayer,
//       ShapeSource: VietMapGL.ShapeSource,
//       PointAnnotation: VietMapGL.PointAnnotation
//     }
    
//     isVietMapAvailable = true
//     console.log('✅ VietMap React Native SDK loaded successfully')
//   } catch (error) {
//     console.warn('❌ VietMap React Native SDK loading failed:', error)
//     isVietMapAvailable = false
//   }
// } else {
//   console.warn('⚠️ VietMap React Native SDK not supported on web platform')
//   isVietMapAvailable = false
// }

// // Fallback components for unsupported platforms
// if (!isVietMapAvailable) {
//   VietMapComponents = {
//     MapView: null,
//     Camera: null,
//     UserLocation: null,
//     LineLayer: null,
//     ShapeSource: null
//   }
// }

// export interface SafeVietMapProps {
//   coordinates: [number, number][]
//   style?: any
//   showUserLocation?: boolean
//   navigationActive?: boolean
//   onLocationUpdate?: (pos: [number, number]) => void
//   externalLocation?: [number, number] | null
//   userMarkerBearing?: number | undefined
// }

// export const SafeVietMapComponent: React.FC<SafeVietMapProps> = ({
//   coordinates,
//   style,
//   showUserLocation = false,
//   navigationActive = false,
//   onLocationUpdate
//   , externalLocation = null,
//   userMarkerBearing
// }) => {
//   // Show appropriate fallback based on platform
//   if (!isVietMapAvailable) {
//     const fallbackMessage = Platform.OS === 'web' 
//       ? 'VietMap chỉ hỗ trợ mobile (iOS/Android)\nVui lòng test trên thiết bị thật hoặc emulator'
//       : 'VietMap SDK chưa được cài đặt\nChạy: npm install @vietmap/vietmap-gl-react-native'
    
//     return (
//       <View style={[styles.fallback, style]} accessible={false}>
// <Text style={styles.fallbackTitle}>🗺️ VietMap</Text>
// <Text style={styles.fallbackText}>{fallbackMessage}</Text>
// <Text style={styles.fallbackCoords}>
//           Platform: {Platform.OS} | Points: {coordinates.length}
//         </Text>
        
//         {/* Mock map for web testing */}
//         {Platform.OS === 'web' && (
//           <View style={styles.mockMap}>
// <Text style={styles.mockMapText}>📱 Test trên mobile để xem VietMap</Text>
//             {coordinates.length > 0 && (
//               <Text style={styles.mockRoute}>
//                 Route: {coordinates[0]?.[1]?.toFixed(4)}, {coordinates[0]?.[0]?.toFixed(4)}
//                 {coordinates.length > 1 && ` → ${coordinates[coordinates.length-1]?.[1]?.toFixed(4)}, ${coordinates[coordinates.length-1]?.[0]?.toFixed(4)}`}
//               </Text>
//             )}
//           </View>
//         )}
//       </View>
//     )
//   }

//   const { MapView, Camera, UserLocation, LineLayer, ShapeSource, PointAnnotation } = VietMapComponents
//   const cameraRef = React.useRef<any>(null)
  
//   // VietMap API key following official documentation
//   const vietmapStyle = `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${process.env.EXPO_PUBLIC_VIETMAP_API_KEY || 'YOUR_API_KEY_HERE'}`
  
//   // Default center coordinate (Ho Chi Minh City)
//   const defaultCenter: [number, number] = [106.800106, 10.704619]
//   // If an externalLocation is provided (from parent requesting recenter), use it.
//   const centerCoordinate = externalLocation || (coordinates.length > 0 ? coordinates[0] : defaultCenter)

//   return (
//     <View style={[{ flex: 1 }, style]} accessible={false}>
//       <MapView 
//         ref={(r: any) => { /* noop ref for MapView */ }}
//         mapStyle={vietmapStyle}
//         style={{ flex: 1 }}
//         accessible={false}
//         tintColor={'#000'}
//       >
//         <Camera
//           ref={cameraRef}
//           zoomLevel={navigationActive ? 16 : 10}
//           followUserLocation={showUserLocation}
//           centerCoordinate={centerCoordinate}
//           animationMode={"easeTo"}
//           animationDuration={1000}
//         />

//         {showUserLocation && UserLocation && (
//           <UserLocation
//             visible={true}
//             showsUserHeadingIndicator={navigationActive}
//             animated={true}
//             onUpdate={onLocationUpdate}
//           />
//         )}

//         {/* Render route line */}
//         {coordinates.length > 1 && ShapeSource && LineLayer && (
//           <ShapeSource
//             id="route-source"
//             shape={{
//               type: 'Feature',
//               properties: {},
//               geometry: {
//                 type: 'LineString',
//                 coordinates: coordinates
//               }
//             }}
//           >
//             <LineLayer
//               id="route-layer"
//               style={{
//                 lineColor: navigationActive ? '#10B981' : '#3B82F6',
//                 lineWidth: navigationActive ? 6 : 4,
//                 lineOpacity: 0.8,
//                 lineJoin: 'round',
//                 lineCap: 'round'
//               }}
//             />
//           </ShapeSource>
//         )}

//         {/* Render vehicle marker at externalLocation when provided */}
//         {externalLocation && PointAnnotation && (
//           <PointAnnotation id="user-marker" coordinate={externalLocation}>
//             <View style={[styles.userMarkerContainer, { transform: [{ rotate: `${(userMarkerBearing ?? 0)}deg` }] }]} pointerEvents="none">
//               <Svg width={44} height={44} viewBox="0 0 24 24">
//                 <Rect x="1" y="6" width="22" height="10" rx="2" fill="#1D4ED8" />
//                 <Path d="M6 6 L8 4 H16 L18 6" fill="#1D4ED8" />
//                 <Circle cx="7.5" cy="17" r="1.6" fill="#0F172A" stroke="#475569" strokeWidth="0.2" />
//                 <Circle cx="16.5" cy="17" r="1.6" fill="#0F172A" stroke="#475569" strokeWidth="0.2" />
//               </Svg>
//             </View>
//           </PointAnnotation>
//         )}
//       </MapView>

//       {/* Small recenter button inside map */}
//       <View style={styles.mapButtonContainer} pointerEvents="box-none">
//         <View style={styles.mapButtonWrap}>
//           <Text
//             accessible={true}
//             accessibilityRole="button"
//             onPress={() => {
//               try {
//                 const target = externalLocation || centerCoordinate
//                 cameraRef.current?.setCamera?.({ centerCoordinate: target, zoomLevel: navigationActive ? 16 : 12, animationDuration: 500 })
//               } catch (e) {
//                 // ignore
//               }
//             }}
//             style={styles.mapButtonText}
//           >📍</Text>
//         </View>
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   fallback: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     padding: 24,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderStyle: 'dashed'
//   },
//   fallbackTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#374151',
//     marginBottom: 8
//   },
//   fallbackText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 12,
//     lineHeight: 20
//   },
//   fallbackCoords: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#9CA3AF',
//     textAlign: 'center',
//     marginBottom: 16
//   },
//   mockMap: {
//     width: '100%',
//     height: 120,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#D1D5DB'
//   },
//   mockMapText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#6B7280',
//     marginBottom: 8
//   },
//   mockRoute: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#9CA3AF',
//     textAlign: 'center',
//     fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
//   }
//   ,
//   userMarkerContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'transparent'
//   },
//   userMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#10B981',
//     borderColor: '#FFFFFF',
//     borderWidth: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 2
//   },
//   mapButtonContainer: {
//     position: 'absolute',
//     right: 12,
//     bottom: 16,
//     width: 48,
//     height: 48
//   },
//   mapButtonWrap: {
//     backgroundColor: '#FFFFFF',
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 6,
//     elevation: 4
//   },
//   mapButtonText: {
//     fontSize: 20,
//     lineHeight: 20
//   }
// })

// export default SafeVietMapComponent

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

// Safe loading pattern for React Native
let VietMapGL: any = null
let isVietMapAvailable = false

if (Platform.OS !== 'web') {
  try {
    VietMapGL = require('@vietmap/vietmap-gl-react-native')
    isVietMapAvailable = !!VietMapGL
  } catch (error) {
    console.warn('VietMap SDK not linked:', error)
  }
}

export interface SafeVietMapProps {
  coordinates: [number, number][]
  secondaryRoute?: [number, number][]
  primaryRouteColor?: string
  secondaryRouteColor?: string
  style?: any
  showUserLocation?: boolean
  navigationActive?: boolean
  onLocationUpdate?: (pos: [number, number]) => void
  externalLocation?: [number, number] | null
  userMarkerBearing?: number | undefined
  driverLocation?: { latitude: number; longitude: number; bearing?: number } | null
}

// Define interface for ref methods
export interface SafeVietMapRef {
  fitToCoordinates: (coords: [number, number][]) => void;
  recenter: () => void;
}

const SafeVietMapComponent = forwardRef<SafeVietMapRef, SafeVietMapProps>(({
  coordinates,
  secondaryRoute,
  primaryRouteColor = '#3B82F6',
  secondaryRouteColor = '#10B981',
  style,
  showUserLocation = false,
  navigationActive = false,
  onLocationUpdate,
  externalLocation = null,
  userMarkerBearing
}, ref) => {
  const cameraRef = useRef<any>(null)

  // Config
  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY || 'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a'
  const mapStyleUrl = `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
  const defaultCenter: [number, number] = [106.800106, 10.704619]
  const centerCoordinate = externalLocation || (coordinates.length > 0 ? coordinates[0] : defaultCenter)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coords) => {
      if (!cameraRef.current || coords.length < 2) return
      // Logic fit bounds (nếu VietMap hỗ trợ fitBounds, nếu không dùng setCamera center)
      cameraRef.current.setCamera({ centerCoordinate: coords[0], zoomLevel: 14, animationDuration: 800 })
    },
    recenter: () => {
      if (!cameraRef.current) return
      cameraRef.current.setCamera({ 
        centerCoordinate: centerCoordinate, 
        zoomLevel: navigationActive ? 17 : 15, 
        animationDuration: 500,
        pitch: navigationActive ? 50 : 0
      })
    }
  }))

  // 1. Fallback View
  if (!isVietMapAvailable) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackIcon}>🗺️</Text>
        <Text style={styles.fallbackTitle}>Native Map Unavailable</Text>
        <Text style={styles.fallbackText}>
          {Platform.OS === 'web' 
            ? 'VietMap Native SDK không hỗ trợ Web.' 
            : 'Chưa cài đặt @vietmap/vietmap-gl-react-native'}
        </Text>
      </View>
    )
  }

  // 2. Native Components Destructuring
  const { MapView, Camera, UserLocation, LineLayer, ShapeSource, PointAnnotation } = VietMapGL

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapView 
        style={{ flex: 1 }}
        mapStyle={mapStyleUrl}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={navigationActive ? 16.5 : 13}
          pitch={navigationActive ? 50 : 0}
          centerCoordinate={centerCoordinate}
          animationMode="easeTo"
          animationDuration={800}
        />

        {/* Native User Location (Blue Dot) */}
        {showUserLocation && (
          <UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
            onUpdate={onLocationUpdate}
          />
        )}

        {/* Route Line */}
        {coordinates.length > 1 && (
          <ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates }
            }}
          >
            <LineLayer
              id="routeLayer"
              style={{
                lineColor: primaryRouteColor,
                lineWidth: navigationActive ? 6 : 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.95
              }}
            />
          </ShapeSource>
        )}

        {/* Secondary route (optional) */}
        {secondaryRoute && secondaryRoute.length > 1 && (
          <ShapeSource
            id="routeSourceSecondary"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: secondaryRoute }
            }}
          >
            <LineLayer
              id="routeLayerSecondary"
              style={{
                lineColor: secondaryRouteColor,
                lineWidth: navigationActive ? 4 : 3,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.6
              }}
            />
          </ShapeSource>
        )}

        {/* Custom Car Marker */}
        {externalLocation && (
          <PointAnnotation id="userMarker" coordinate={externalLocation}>
            <View style={[styles.markerContainer, { transform: [{ rotate: `${userMarkerBearing ?? 0}deg` }] }]}>
              <Svg width={40} height={40} viewBox="0 0 24 24">
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#3B82F6" stopOpacity="1" />
                    <Stop offset="1" stopColor="#1D4ED8" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Circle cx="12" cy="12" r="11" fill="rgba(59, 130, 246, 0.2)" />
                <Path d="M12 2L20 20H4L12 2Z" fill="url(#grad)" /> 
                <Circle cx="12" cy="12" r="3" fill="#FFF" />
              </Svg>
            </View>
          </PointAnnotation>
        )}
      </MapView>
      
      {/* Đã xóa nút FAB Recenter ở đây để Parent quản lý */}
    </View>
  )
})

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed'
  },
  fallbackIcon: { fontSize: 32, marginBottom: 12 },
  fallbackTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  fallbackText: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  markerContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
})

export default SafeVietMapComponent