import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { decodePolyline } from '@/utils/polyline'

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
  const [status, setStatus] = useState('Initializing VietMap Web SDK...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('VietMap Web SDK is only for web platform')
      return
    }

    const initVietMapWebSDK = async () => {
      try {
        setStatus('Loading VietMap GL JS from CDN...')
        
        // Load VietMap GL JS from CDN (as per official docs)
        if (!(window as any).vietmapgl) {
          // Dynamically load CSS
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css'
          document.head.appendChild(link)

          // Dynamically load JS
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js'
          
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        setStatus('✅ VietMap GL JS loaded from CDN')

        if (!containerRef.current) {
          setError('Container not ready')
          return
        }

        const apiKey = process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY || 'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a'
        if (!apiKey) {
          setError('API Key not found')
          return
        }

        setStatus('Creating VietMap instance...')

        // Use VietMap GL from global window object
        const vietmapgl = (window as any).vietmapgl
        
        const map = new vietmapgl.Map({
          container: containerRef.current,
          // Use VietMap's style URL from document
          style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
          center: [106.8019, 10.8412], // Ho Chi Minh City [lng, lat]
          zoom: 12
        })

        mapRef.current = map

        map.on('load', () => {
          setStatus('🗺️ VietMap Web SDK loaded successfully!')
          console.log('✅ VietMap Web SDK map loaded')
          onMapLoad?.()
          
          // Add route if available
          addRouteToMap(map)
        })

        map.on('error', (e: any) => {
          console.error('❌ VietMap error:', e)
          setError(`Map error: ${e.error?.message || 'Unknown error'}`)
        })

        // Add controls
        map.addControl(new vietmapgl.NavigationControl())
        
      } catch (error) {
        console.error('❌ VietMap Web SDK error:', error)
        setError(`Failed to load VietMap Web SDK: ${error.message}`)
        setStatus('❌ Failed to initialize')
      }
    }

    initVietMapWebSDK()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  const addRouteToMap = (map: any) => {
    if (!map) return

    // Get coordinates from props
    let coords: [number, number][] = []
    
    if (coordinates && coordinates.length > 0) {
      coords = coordinates
    } else if (routeData) {
      try {
        const decoded = decodePolyline(routeData, 5)
        coords = decoded.coordinates as [number, number][]
      } catch (e) {
        console.error('Failed to decode route:', e)
        return
      }
    }

    if (coords.length === 0) return

    // Add route line
    if (map.getSource('route')) {
      map.removeLayer('route-line')
      map.removeSource('route')
    }

    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      }
    })

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 6,
        'line-opacity': 0.8
      }
    })

    // Add markers if enabled
    if (showOverviewMarkers) {
      const start = startMarker || coords[0]
      const end = endMarker || coords[coords.length - 1]

      if (start) {
        new (window as any).vietmapgl.Marker({ color: '#16A34A' })
          .setLngLat(start)
          .addTo(map)
      }
      if (end) {
        new (window as any).vietmapgl.Marker({ color: '#DC2626' })
          .setLngLat(end)
          .addTo(map)
      }
    }

    // Fit map to route
    const bounds = coords.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new (window as any).vietmapgl.LngLatBounds(coords[0], coords[0]))

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    })
  }

  // Update route when props change
  useEffect(() => {
    if (mapRef.current && status.includes('loaded successfully')) {
      addRouteToMap(mapRef.current)
    }
  }, [routeData, coordinates, startMarker, endMarker, showOverviewMarkers])

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
<Text style={styles.title}>🌐 VietMap Web SDK</Text>
<View style={styles.mobileMessage}>
<Text style={styles.messageText}>
            VietMap Web SDK is designed for web browsers.
            Use @vietmap/vietmap-gl-react-native for mobile platforms.
          </Text>
</View>
</View>
    )
  }

  return (
    <View style={styles.container}>
<Text style={styles.title}>🗺️ VietMap Web SDK (Official)</Text>
<div
        ref={containerRef}
        style={{
          width: '100%',
          height: style?.height || '350px',
          borderRadius: '8px',
          border: '2px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          ...style
        }}
      />
<View style={styles.statusContainer}>
<Text style={styles.statusTitle}>Status:</Text>
<Text style={styles.statusText}>{status}</Text>
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </View>
<View style={styles.infoContainer}>
<Text style={styles.infoTitle}>🎯 Key Differences:</Text>
<Text style={styles.infoText}>• Using @vietmap/vietmap-gl-js (official web SDK)</Text>
<Text style={styles.infoText}>• NOT MapLibre GL JS (generic library)</Text>
<Text style={styles.infoText}>• Style URL: /maps/styles/tm/style.json</Text>
<Text style={styles.infoText}>• Proper VietMap authentication</Text>
</View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center'
  },
  mobileMessage: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  messageText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20
  },
  statusContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  infoContainer: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 6
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 6
  },
  infoText: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 2
  }
})

export default VietMapWebSDK