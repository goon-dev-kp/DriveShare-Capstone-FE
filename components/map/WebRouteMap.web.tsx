import React, { useEffect, useRef, useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { decodePolyline } from '@/utils/polyline'
import { computeBounds } from '@/utils/map'
import { vietmapStyleUrl, vietmapAPIKey } from '@/config/vietmap'

export interface WebRouteMapProps {
  routeData?: string | null
  coordinates?: [number, number][]
  style?: any
  showUserLocation?: boolean
  followUserLocation?: boolean
  followZoomLevel?: number
  followPitch?: number
  followBearing?: number
  userMarkerPosition?: [number, number]
  userMarkerBearing?: number
  startMarker?: [number, number]
  endMarker?: [number, number]
  showOverviewMarkers?: boolean
  currentMarker?: [number, number]
}

const WebRouteMap: React.FC<WebRouteMapProps> = ({ routeData, coordinates, style, showUserLocation, followUserLocation, followZoomLevel, followPitch, followBearing, userMarkerPosition, userMarkerBearing, startMarker, endMarker, showOverviewMarkers, currentMarker }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [fallbackActive, setFallbackActive] = useState(false)
  const markerRef = useRef<any>(null)
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const currentLabelRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)

  const coords = useMemo(() => {
    if (coordinates && coordinates.length > 0) return coordinates
    if (routeData) return decodePolyline(routeData, 5).coordinates
    return [] as [number, number][]
  }, [routeData, coordinates])

  const resolvedStyleUrl = useMemo(() => vietmapStyleUrl('light'), [])
  const styleHasKey = useMemo(() => {
    try {
      const u = new URL(resolvedStyleUrl, window.location.origin)
      return !!u.searchParams.get('apikey')
    } catch { return false }
  }, [resolvedStyleUrl])

  // Helpers for route-snapped bearing when device heading is unavailable
  const nearestIndex = (pos: [number, number], arr: [number, number][]) => {
    let best = 0; let bestD = Number.POSITIVE_INFINITY
    for (let i = 0; i < arr.length; i++) {
      const dx = arr[i][0] - pos[0]
      const dy = arr[i][1] - pos[1]
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = i }
    }
    return best
  }
  const bearingBetween = (a: [number, number], b: [number, number]) => {
    // a=[lng,lat], b=[lng,lat]
    const toRad = (d: number) => d * Math.PI / 180
    const toDeg = (r: number) => r * 180 / Math.PI
    const φ1 = toRad(a[1]); const φ2 = toRad(b[1])
    const Δλ = toRad(b[0] - a[0])
    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ) + Math.sin(φ1) * Math.sin(φ2)
    const θ = Math.atan2(y, x)
    const brng = (toDeg(θ) + 360) % 360
    return brng
  }

  useEffect(() => {
    let map: any = null
    let appliedFallback = false
    let styleLoaded = false

    const init = async () => {
      if (!containerRef.current) return
      
      // Get the actual DOM element from React Native Web View
      const container = (containerRef.current as any)._nativeTag || containerRef.current
      if (!container) return
      
      try {
        // Try to use VietMap GL JS first (like VietMapWebSDK), then fallback to MapLibre
        let MapGL: any
        
        // First try VietMap GL JS (official)
        if ((window as any).vietmapgl) {
          MapGL = (window as any).vietmapgl
          console.log('✅ Using VietMap GL JS (official)')
        } else {
          // Fallback to MapLibre GL JS
          try {
            const mod: any = await import('maplibre-gl')
            MapGL = mod?.default ?? mod
            console.log('✅ Using MapLibre GL JS (fallback)')
          } catch (e) {
            console.warn('MapLibre import failed:', e)
            MapGL = (globalThis as any)?.maplibregl
          }
        }
        
        if (!MapGL) {
          console.error('❌ No map library available')
          setFallbackActive(true)
          return
        }

        const appendApiKey = (url: string) => {
          try {
            const u = new URL(url, window.location.origin)
            if (u.hostname.includes('maps.vietmap.vn') && !u.searchParams.has('apikey') && vietmapAPIKey) {
              u.searchParams.set('apikey', vietmapAPIKey)
            }
            return u.toString()
          } catch {
            return url
          }
        }

        const addRouteLayer = () => {
          if (!coords.length) return
          const line = {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords }
          }
          if (!map.getSource('route')) {
            map.addSource('route', { type: 'geojson', data: line })
          } else {
            const src = map.getSource('route')
            src?.setData?.(line)
          }
          if (!map.getLayer('route')) {
            map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#2563EB', 'line-width': 4 } })
          }
          const b = computeBounds(coords)
          if (b) {
            map.fitBounds([b.sw as any, b.ne as any], { padding: 40, duration: 600 })
          }
        }

        map = new MapGL.Map({
          container: container,
          style: resolvedStyleUrl,
          center: coords[0] || [106.8019, 10.8412],
          zoom: 12,
          transformRequest: (url: string, resourceType: string) => {
            return { url: appendApiKey(url) }
          }
        })
        mapRef.current = map

        map.on('load', () => {
          styleLoaded = true
          ;(mapRef.current as any).__loaded = true
          console.log('✅ VietMap style loaded successfully!')
          addRouteLayer()
          if (followUserLocation) {
            try { map.setPitch(55) } catch {}
          }
        })

        map.on('error', (e: any) => {
          const msg = String(e?.error?.message || '')
          const status = (e?.error?.status || e?.status) as number | undefined
          const unauthorized = status === 401 || status === 403 || msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')
          const isTileParse = msg.includes('Unable to parse the tile')
          const isNetworkError = msg.includes('NetworkError') || msg.includes('fetch')
          
          // Only fallback on critical auth failures, not on minor tile loading issues
          const shouldFallback = !appliedFallback && !styleLoaded && unauthorized && !isNetworkError
          
          console.warn('VietMap error:', { msg, status, unauthorized, isTileParse, isNetworkError, shouldFallback })
          
          if (shouldFallback) {
            appliedFallback = true
            setFallbackActive(true)
            console.log('🔄 Falling back to OSM due to VietMap auth failure')
            const osmStyle = {
              version: 8,
              sources: {
                osm: {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '&copy; OpenStreetMap contributors'
                }
              },
              layers: [
                { id: 'osm', type: 'raster', source: 'osm' }
              ]
            } as any
            map.setStyle(osmStyle)
            map.once('load', () => addRouteLayer())
          }
        })
      } catch (err) {
        console.warn('maplibre-gl not available for web fallback', err)
      }
    }

    init()
    return () => { if (map) map.remove(); mapRef.current = null }
  }, [coords, resolvedStyleUrl, followUserLocation])

  // Update route and fit when coordinates change after map is ready
  useEffect(() => {
    const map = mapRef.current
    if (!map || !coords.length) return
    const apply = () => {
      const line = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords }
      }
      try {
        if (!map.getSource('route')) {
          map.addSource('route', { type: 'geojson', data: line })
        } else {
          map.getSource('route')?.setData?.(line)
        }
        if (!map.getLayer('route')) {
          map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#2563EB', 'line-width': 4 } })
        }
      } catch {}
      try {
        const b = computeBounds(coords)
        if (b) map.fitBounds([b.sw as any, b.ne as any], { padding: 40, duration: 600 })
      } catch {}
    }
    if ((map as any).__loaded) apply()
    else map.once('load', apply)
  }, [coords])

  // Watch browser geolocation to emulate first-person follow on web
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const navEnabled = !!followUserLocation || !!showUserLocation || !!userMarkerPosition
    if (!navEnabled) {
      if (watchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current) } catch {}
        watchIdRef.current = null
      }
      if (markerRef.current) {
        try { markerRef.current.remove() } catch {}
        markerRef.current = null
      }
      return
    }
    if (!('geolocation' in navigator)) return
    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords
          const lngLat: [number, number] = [longitude, latitude]
          const lngLatSource = userMarkerPosition ?? lngLat
          if (!markerRef.current) {
            let MapLibre: any = (globalThis as any)?.maplibregl
            if (!MapLibre) return
            const el = document.createElement('div')
            el.style.width = '34px'; el.style.height = '34px'; el.style.borderRadius = '17px'
            el.style.background = '#FFFFFF'
            el.style.border = '1px solid #E5E7EB'
            el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center'
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
            const svg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="10" width="18" height="6" rx="2" fill="#1D4ED8"/>
<path d="M7 10 L10 7 H14 L17 10 Z" fill="#1D4ED8"/>
<circle cx="8" cy="17" r="2" fill="#111827" stroke="#374151" stroke-width="1"/>
<circle cx="16" cy="17" r="2" fill="#111827" stroke="#374151" stroke-width="1"/>
</svg>`
            el.innerHTML = svg
            markerRef.current = new MapLibre.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' })
              .setLngLat(lngLatSource)
              .addTo(map)
          } else {
            markerRef.current.setLngLat(lngLatSource)
          }
          let frameBearing: number | undefined = userMarkerBearing ?? ((typeof heading === 'number' && !Number.isNaN(heading)) ? heading : undefined)
          if (frameBearing === undefined && coords.length > 1) {
            const ni = nearestIndex(lngLatSource, coords)
            const target = coords[Math.min(ni + 1, coords.length - 1)]
            if (target) frameBearing = bearingBetween(lngLat, target)
          }
          if (typeof frameBearing === 'number') {
            try { markerRef.current.setRotation(frameBearing) } catch {}
          }
          if (followUserLocation || userMarkerPosition) {
            try {
              const cameraBearing = followBearing !== undefined ? followBearing : ((typeof frameBearing === 'number') ? frameBearing : (map.getBearing?.() ?? 0))
              const cameraPitch = followPitch !== undefined ? followPitch : 55
              
              map.easeTo({
                center: lngLatSource,
                zoom: (followZoomLevel ?? 17),
                bearing: cameraBearing,
                pitch: cameraPitch,
                duration: 600
              })
            } catch {}
          }
        },
        () => { /* ignore errors to avoid noisy UX */ },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      )
      watchIdRef.current = id
    } catch {}
    return () => {
      if (watchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current) } catch {}
        watchIdRef.current = null
      }
      if (markerRef.current) {
        try { markerRef.current.remove() } catch {}
        markerRef.current = null
      }
    }
  }, [followUserLocation, followZoomLevel, showUserLocation])

  // Ensure marker is visible even if browser geolocation isn't available, using incoming props
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userMarkerPosition) return
    try {
      let MapLibre: any = (globalThis as any)?.maplibregl
      if (!MapLibre) return
      if (!markerRef.current) {
        const el = document.createElement('div')
        el.style.width = '34px'; el.style.height = '34px'; el.style.borderRadius = '17px'
        el.style.background = '#FFFFFF'
        el.style.border = '1px solid #E5E7EB'
        el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
        const svg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="10" width="18" height="6" rx="2" fill="#1D4ED8"/>
<path d="M7 10 L10 7 H14 L17 10 Z" fill="#1D4ED8"/>
<circle cx="8" cy="17" r="2" fill="#111827" stroke="#374151" stroke-width="1"/>
<circle cx="16" cy="17" r="2" fill="#111827" stroke="#374151" stroke-width="1"/>
</svg>`
        el.innerHTML = svg
        markerRef.current = new MapLibre.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' })
          .setLngLat(userMarkerPosition)
          .addTo(map)
      } else {
        markerRef.current.setLngLat(userMarkerPosition)
      }
      if (typeof userMarkerBearing === 'number') {
        try { markerRef.current.setRotation(userMarkerBearing) } catch {}
      }
    } catch {}
  }, [userMarkerPosition, userMarkerBearing])

  // Start/End markers during overview
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let MapLibre: any = (globalThis as any)?.maplibregl
    if (!MapLibre) return
    const cleanup = () => {
      try { startMarkerRef.current?.remove?.() } catch {}
      try { endMarkerRef.current?.remove?.() } catch {}
      try { currentLabelRef.current?.remove?.() } catch {}
      startMarkerRef.current = null
      endMarkerRef.current = null
      currentLabelRef.current = null
    }
    if (!showOverviewMarkers) { cleanup(); return }
    if (startMarker) {
      const el = document.createElement('div')
      el.style.padding = '4px 6px'
      el.style.borderRadius = '12px'
      el.style.background = '#16A34A'
      el.style.color = '#fff'
      el.style.fontWeight = '800'
      el.style.border = '1px solid #86EFAC'
      el.textContent = 'A'
      startMarkerRef.current = new MapLibre.Marker({ element: el })
        .setLngLat(startMarker)
        .addTo(map)
    }
    if (endMarker) {
      const el = document.createElement('div')
      el.style.padding = '4px 6px'
      el.style.borderRadius = '12px'
      el.style.background = '#DC2626'
      el.style.color = '#fff'
      el.style.fontWeight = '800'
      el.style.border = '1px solid #FCA5A5'
      el.textContent = 'B'
      endMarkerRef.current = new MapLibre.Marker({ element: el })
        .setLngLat(endMarker)
        .addTo(map)
    }
    if (currentMarker) {
      const el = document.createElement('div')
      el.style.padding = '4px 6px'
      el.style.borderRadius = '12px'
      el.style.background = '#111827'
      el.style.color = '#fff'
      el.style.fontWeight = '800'
      el.style.border = '1px solid #374151'
      el.textContent = 'Bạn'
      currentLabelRef.current = new MapLibre.Marker({ element: el })
        .setLngLat(currentMarker)
        .addTo(map)
    }
    return cleanup
  }, [startMarker, endMarker, currentMarker, showOverviewMarkers])

  if (!coords.length) return <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}><Text>Không có dữ liệu tuyến đường</Text></View>

  // Flatten RN style to extract only width/height for proper React Native Web styling
  const flat = StyleSheet.flatten([{ width: '100%', height: 300 }, style]) as any
  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
<View
        ref={containerRef as any}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: flat?.borderRadius,
          overflow: 'hidden'
        }}
      />
      {fallbackActive ? (
        <View style={{ 
          position: 'absolute', 
          bottom: 8, 
          left: 8, 
          backgroundColor: 'rgba(17,24,39,0.8)', 
          paddingHorizontal: 10, 
          paddingVertical: 6, 
          borderRadius: 10, 
          borderWidth: 1, 
          borderColor: '#1F2937' 
        }}>
<Text style={{ color: '#F9FAFB', fontSize: 12 }}>OSM fallback • Kiểm tra Vietmap API key/CORS</Text>
</View>
      ) : null}
      {!fallbackActive && process.env.NODE_ENV !== 'production' ? (
        <View style={{ 
          position: 'absolute', 
          bottom: 8, 
          right: 8, 
          backgroundColor: 'rgba(17,24,39,0.6)', 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 8 
        }}>
<Text style={{ color: '#E5E7EB', fontSize: 11 }}>
            {styleHasKey ? 'Vietmap style: key attached' : 'Vietmap style: missing key param'}
          </Text>
</View>
      ) : null}
      {/* Recenter button for web */}
      <View style={{ position: 'absolute', right: 12, bottom: 12, width: 48, height: 48 }}>
        <View style={{ backgroundColor: '#fff', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.12)' as any }}>
          <Text
            onPress={() => {
              try {
                const map = mapRef.current
                if (!map) return
                const target = userMarkerPosition ?? coords[0] ?? [106.8019, 10.8412]
                map.easeTo({ center: target, zoom: (followZoomLevel ?? 17), duration: 600 })
              } catch {}
            }}
            style={{ fontSize: 20, lineHeight: 20 }}
          >📍</Text>
        </View>
      </View>
    </View>
  )
}

export default WebRouteMap
