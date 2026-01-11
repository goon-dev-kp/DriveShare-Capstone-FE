

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native'

declare global {
  interface Window {
    vietmapgl: any;
  }
}

export interface VietMapWebWrapperProps {
  coordinates: [number, number][]
  secondaryRoute?: [number, number][]
  primaryRouteColor?: string
  secondaryRouteColor?: string
  style?: any
  showUserLocation?: boolean
  navigationActive?: boolean
  onLocationUpdate?: (pos: [number, number]) => void
  onMapReady?: () => void
  onMapClick?: (coordinates: [number, number]) => void
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  driverLocation?: { latitude: number; longitude: number; bearing?: number } | null
}

// CDN VietMap GL JS v6 (Link chuẩn)
const SDK_CONFIG = {
  css: 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css',
  js: 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js'
}

export const VietMapWebWrapper: React.FC<VietMapWebWrapperProps> = ({
  coordinates,
  secondaryRoute,
  primaryRouteColor = '#3B82F6',
  secondaryRouteColor = '#10B981',
  style,
  showUserLocation = false,
  navigationActive = false,
  onLocationUpdate,
  onMapReady,
  onMapClick,
  userMarkerPosition,
  userMarkerBearing,
  driverLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 1. Load Resource
  const loadResource = (url: string, type: 'link' | 'script') => {
    return new Promise<void>((resolve, reject) => {
      if (type === 'script' && document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
      if (type === 'link' && document.querySelector(`link[href="${url}"]`)) { resolve(); return; }

      const element = document.createElement(type) as any
      if (type === 'link') { element.rel = 'stylesheet'; element.href = url } 
      else { element.src = url; element.async = true }

      element.onload = () => resolve()
      element.onerror = () => reject(new Error(`Không thể tải: ${url}`))
      document.head.appendChild(element)
    })
  }

  // NOTE: route layers handled by addRouteLayer below (supports primary + secondary)

  // 2. Load SDK
  const loadVietMapSDK = useCallback(async () => {
    if (Platform.OS !== 'web') return
    if (window.vietmapgl) { initializeMap(); return; }

    try {
      await Promise.all([
        loadResource(SDK_CONFIG.css, 'link'),
        loadResource(SDK_CONFIG.js, 'script')
      ])
      setTimeout(initializeMap, 100)
    } catch (e: any) {
      console.error('SDK Error:', e)
      setLoadError('Lỗi kết nối VietMap SDK')
    }
  }, [])

  // 3. Initialize Map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.vietmapgl || mapRef.current) return
    
    try {
      const apiKey = process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY || 'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a'
      
      if (!apiKey) {
        setLoadError('Thiếu Tilemap Key trong .env')
        return
      }

      // URL Style chuẩn (Raster) - Loại này ít lỗi nhất trên web
      const styleUrl = `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
      
      const center = coordinates.length > 0 ? coordinates[0] : [106.800106, 10.704619]

      const map = new window.vietmapgl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: center,
        zoom: navigationActive ? 15 : 12,
        pitch: navigationActive ? 50 : 0,
        hash: false,
        preserveDrawingBuffer: true // Quan trọng để tránh map bị trắng khi render
      })

      mapRef.current = map
      
      map.on('load', () => {
        console.log('✅ Map loaded event fired!')
        
        // FIX QUAN TRỌNG: Resize map để nó nhận diện đúng kích thước div
        map.resize()

        setIsMapLoaded(true)
        addRouteLayer()
        onMapReady?.()
      })

      // Bắt lỗi Style (quan trọng để debug)
      map.on('error', (e: any) => {
          console.error("⚠️ Map Style Error:", e);
          if (e?.error?.status === 403 || e?.error?.status === 401) {
             setLoadError('API Key không hợp lệ hoặc bị chặn domain.')
          }
      })

      map.on('click', (e: any) => onMapClick?.([e.lngLat.lng, e.lngLat.lat]))
      map.addControl(new window.vietmapgl.NavigationControl(), 'top-right')

    } catch (e: any) {
      setLoadError(e.message)
    }
  }, [navigationActive])

  // 4. Route Layer
  const addRouteLayer = useCallback(() => {
    const map = mapRef.current
    if (!map || !isMapLoaded) return

    const sourceId = 'route-source'
    const layerId = 'route-layer'
    const secondarySourceId = 'route-source-secondary'
    const secondaryLayerId = 'route-layer-secondary'

    try {
      // Coerce coordinates and filter invalid
      const pts = (coordinates || []).map((c: any) => [Number(c[0]), Number(c[1])]).filter((c: any) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
      const pts2 = (secondaryRoute || []).map((c: any) => [Number(c[0]), Number(c[1])]).filter((c: any) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
      if (pts.length < 2 && pts2.length < 2) {
        console.debug('[VietMapWebWrapper] addRouteLayer: not enough points for either route, pts=', pts.length, 'pts2=', pts2.length)
        return
      }

      // Ensure map resizes to correct container size
      try { if (typeof map.resize === 'function') map.resize() } catch (e) {}

      // Update existing source if present
      // Primary route
      if (pts.length >= 2) {
        if (map.getSource && map.getSource(sourceId)) {
          try { (map.getSource(sourceId) as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } }) } catch (e) { console.warn('[VietMapWebWrapper] setData primary failed', e) }
        } else {
          map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } } })
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': primaryRouteColor,
              'line-width': navigationActive ? 8 : 6,
              'line-opacity': 0.95
            }
          })
        }
      }

      // Secondary route (drawn under/behind primary when present)
      if (pts2.length >= 2) {
        if (map.getSource && map.getSource(secondarySourceId)) {
          try { (map.getSource(secondarySourceId) as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts2 } }) } catch (e) { console.warn('[VietMapWebWrapper] setData secondary failed', e) }
        } else {
          map.addSource(secondarySourceId, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts2 } } })
          map.addLayer({
            id: secondaryLayerId,
            type: 'line',
            source: secondarySourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': secondaryRouteColor,
              'line-width': navigationActive ? 5 : 4,
              'line-opacity': 0.6
            }
          }, layerId) // insert below primary if primary exists
        }
      }

      try {
        const bounds = new window.vietmapgl.LngLatBounds()
        const extPts = pts.length >= 2 ? pts : pts2
        extPts.forEach((c: any) => bounds.extend(c))
        map.fitBounds(bounds, { padding: 50 })
      } catch (e) { console.warn('[VietMapWebWrapper] fitBounds failed', e) }

      console.debug('[VietMapWebWrapper] Route added/updated primaryPts=', pts.length, 'secondaryPts=', pts2.length)
    } catch (e) {
      console.error('[VietMapWebWrapper] addRouteLayer failed:', e)
    }
  }, [coordinates, secondaryRoute, navigationActive, isMapLoaded, primaryRouteColor, secondaryRouteColor])

  // 5. User Marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapLoaded || !userMarkerPosition) return

    if (!markerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="width: 24px; height: 24px; background: #2563EB; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
      `
      markerRef.current = new window.vietmapgl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat(userMarkerPosition)
        .addTo(map)
    } else {
      markerRef.current.setLngLat(userMarkerPosition)
    }
    
    if (navigationActive) {
        map.easeTo({ center: userMarkerPosition })
    }
  }, [userMarkerPosition, userMarkerBearing, isMapLoaded, navigationActive])

  // 6. Driver Marker (for Owner view - showing driver's real-time location)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapLoaded || !driverLocation) {
      // Remove marker if no driver location
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove()
        driverMarkerRef.current = null
      }
      return
    }

    const driverPos: [number, number] = [driverLocation.longitude, driverLocation.latitude]

    if (!driverMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #10B981; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">🚗</div>
      `
      driverMarkerRef.current = new window.vietmapgl.Marker({ 
        element: el, 
        rotationAlignment: 'map',
        rotation: driverLocation.bearing || 0
      })
        .setLngLat(driverPos)
        .addTo(map)
    } else {
      driverMarkerRef.current.setLngLat(driverPos)
      if (driverLocation.bearing !== undefined) {
        driverMarkerRef.current.setRotation(driverLocation.bearing)
      }
    }
  }, [driverLocation, isMapLoaded])

  useEffect(() => { loadVietMapSDK() }, [])
  useEffect(() => {
    // Try to add/update route immediately if map ready, otherwise retry a few times
    let intervalId: any = null
    const maxAttempts = 8
    let attempts = 0

    const tryAdd = () => {
      try {
        if (isMapLoaded) {
          addRouteLayer()
          return true
        }
      } catch (e) {}
      return false
    }

    if (!tryAdd()) {
      intervalId = setInterval(() => {
        attempts += 1
        if (tryAdd() || attempts >= maxAttempts) {
          if (attempts >= maxAttempts) console.warn('[VietMapWebWrapper] addRouteLayer retry exhausted')
          clearInterval(intervalId)
        }
      }, 500)
    }

    return () => { if (intervalId) clearInterval(intervalId) }
  }, [coordinates, isMapLoaded, addRouteLayer])

  if (Platform.OS !== 'web') return null

  return (
    // FIX QUAN TRỌNG: Thêm minHeight vào Container View
    <View style={[styles.container, style, { minHeight: 300 }]}>
      
      {/* FIX QUAN TRỌNG: Div style tuyệt đối để lấp đầy View cha */}
      <div 
        ref={mapContainerRef} 
        style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            backgroundColor: '#E5E7EB' // Màu nền xám để biết khung có hiện
        }} 
      />
      
      {!isMapLoaded && !loadError && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      )}

      {loadError && (
        <View style={styles.centerOverlay}>
            <Text style={{fontSize: 24}}>⚠️</Text>
            <Text style={[styles.loadingText, {color: 'red'}]}>{loadError}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 12, backgroundColor: '#E5E7EB', position: 'relative' },
  centerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', zIndex: 10 },
  loadingText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#374151' }
})

export default VietMapWebWrapper