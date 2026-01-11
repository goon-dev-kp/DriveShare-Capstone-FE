import React, { useEffect, useRef } from 'react'
import { View, Text } from 'react-native'

// Lightweight Mapbox GL JS fallback for web. This file dynamically imports mapbox-gl
// at runtime only when running on web. The project must install `mapbox-gl` and
// provide a MAPBOX_TOKEN via environment. If mapbox-gl is not installed, this
// component shows an instruction message.

interface Props {
  containerStyle?: any
  coordinates?: [number, number][]
  accessToken?: string
}

const MapboxWebFallback: React.FC<Props> = ({ containerStyle, coordinates, accessToken }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let map: any = null
    let Mapbox: any = null
    const init = () => {
      try {
        // Use eval('require') to avoid static analysis for projects that don't install mapbox-gl
        // eslint-disable-next-line no-eval
        const req = eval('require')
        Mapbox = req('mapbox-gl')
        Mapbox = Mapbox.default || Mapbox
        Mapbox.accessToken = accessToken || ''
        if (!mapContainerRef.current) return
        map = new Mapbox.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: coordinates && coordinates.length > 0 ? coordinates[0] : [106.8019, 10.8412],
          zoom: 10,
        })
        if (coordinates && coordinates.length > 0) {
          const line = {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates }
          }
          map.on('load', () => {
            if (!map.getSource('route')) {
              map.addSource('route', { type: 'geojson', data: line })
              map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#2563EB', 'line-width': 4 } })
            }
          })
        }
      } catch (e) {
        // mapbox-gl not installed or failed to initialize
        console.warn('Mapbox GL JS not available:', e)
      }
    }
    if (typeof window !== 'undefined') init()
    return () => { if (map) map.remove() }
  }, [coordinates, accessToken])

  if (typeof window === 'undefined') {
    return <View style={containerStyle}><Text>Map unavailable</Text></View>
  }

  // If mapbox-gl not installed, the div will remain empty; user should install dependency
  return <div ref={mapContainerRef as any} style={containerStyle ?? { width: '100%', height: '220px' }} />
}

export default MapboxWebFallback
