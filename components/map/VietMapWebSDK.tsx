import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { decodePolyline } from '@/utils/polyline'
import { vietmapAPIKey, vietmapStyleUrl } from '@/config/vietmap'

interface VietMapWebSDKProps {
  style?: any
  onMapLoad?: () => void
  routeData?: string | null
  coordinates?: [number, number][]
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
}

const VietMapWebSDK: React.FC<VietMapWebSDKProps> = ({ 
  style, 
  onMapLoad, 
  routeData, 
  coordinates,
  startMarker,
  endMarker,
  showOverviewMarkers = true
}) => {
  const containerRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useRef(true) // Track mounted state

  useEffect(() => {
    isMounted.current = true
    
    // Chỉ chạy trên Web
    if (Platform.OS !== 'web') return

    const initVietMapWebSDK = async () => {
      try {
        // 1. Inject CSS
        if (!document.getElementById('vietmap-gl-css')) {
            const link = document.createElement('link')
            link.id = 'vietmap-gl-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css'
            document.head.appendChild(link)
        }

        // 2. Inject JS & Init Map
        if (!(window as any).vietmapgl) {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js'
          
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (!containerRef.current || !isMounted.current) return

        const vietmapgl = (window as any).vietmapgl
        
        // Khởi tạo Map với API key từ config
        const map = new vietmapgl.Map({
          container: containerRef.current,
          style: vietmapStyleUrl('light', 'vector'),
          center: [106.8019, 10.8412], // Default Center (HCM)
          zoom: 12,
          pitch: 0,
          attributionControl: false
        })

        mapRef.current = map

        map.on('load', () => {
          if (!isMounted.current) return
          setIsLoading(false)
          onMapLoad?.()
          
          // Thêm control
          map.addControl(new vietmapgl.NavigationControl(), 'top-right')
          
          // Vẽ đường đi ngay khi load xong
          addRouteToMap(map)
        })

        // Handle style loading errors
        map.on('error', (e: any) => {
            if (isMounted.current) console.warn('Map warning/error:', e)
        })

      } catch (error) {
        console.error('❌ Error loading VietMap:', error)
        if (isMounted.current) setIsLoading(false)
      }
    }

    initVietMapWebSDK()

    return () => {
      isMounted.current = false
      if (mapRef.current) {
        try {
            // Remove map gracefully to avoid AbortError
            mapRef.current.remove()
        } catch (e) {
            // Ignore styling removal errors during hot reload
        }
        mapRef.current = null
      }
    }
  }, [])

  // Hàm vẽ Route & Marker (Đã fix lỗi Style is not done loading)
  const addRouteToMap = (map: any) => {
    if (!map) return

    // FIX: Kiểm tra nếu style chưa load xong thì đợi, không addSource ngay
    if (!map.isStyleLoaded()) {
        // Đợi sự kiện styledata rồi thử lại
        map.once('styledata', () => addRouteToMap(map))
        return
    }

    // 1. Xử lý coordinates
    let coords: [number, number][] = []
    if (coordinates && coordinates.length > 0) {
      coords = coordinates
    } else if (routeData) {
      try {
        const decoded = decodePolyline(routeData, 5)
        coords = decoded.coordinates as [number, number][]
      } catch (e) {
        console.error('Decode failed', e)
        return
      }
    }

    if (coords.length === 0) return

    try {
        // 2. Vẽ Line (Polyline) - Xóa cũ trước nếu có
        if (map.getSource('route')) {
            if (map.getLayer('route-line')) map.removeLayer('route-line')
            map.removeSource('route')
        }

        map.addSource('route', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords }
        }
        })

        map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': '#3B82F6',
            'line-width': 6,
            'line-opacity': 0.9
        }
        })

        // 3. Thêm Marker A -> B
        if (showOverviewMarkers) {
        // Xóa marker cũ logic (ở đây ta rebuild map nên ko cần xóa thủ công phức tạp)
        const start = startMarker || coords[0]
        const end = endMarker || coords[coords.length - 1]

        // Helper tạo element marker
        const createMarkerEl = (color: string, label: string) => {
            const el = document.createElement('div')
            el.innerHTML = `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">${label}</div>`
            return el
        }

        if (start) {
            new (window as any).vietmapgl.Marker({ element: createMarkerEl('#10B981', 'A') })
            .setLngLat(start)
            .addTo(map)
        }
        
        if (end) {
            new (window as any).vietmapgl.Marker({ element: createMarkerEl('#EF4444', 'B') })
            .setLngLat(end)
            .addTo(map)
        }
        }

        // 4. Zoom fit
        const bounds = coords.reduce((bounds, coord) => {
        return bounds.extend(coord)
        }, new (window as any).vietmapgl.LngLatBounds(coords[0], coords[0]))

        map.fitBounds(bounds, { padding: 80, duration: 1000 })
    } catch (err) {
        console.warn('Error adding route layer:', err)
    }
  }

  // Re-render route khi props thay đổi
  useEffect(() => {
    if (mapRef.current && !isLoading) {
        addRouteToMap(mapRef.current)
    }
  }, [routeData, coordinates, startMarker, endMarker, isLoading])

  // Fallback cho Mobile App
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
         <ActivityIndicator color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          outline: 'none'
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  }
})

export default VietMapWebSDK