import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import RouteMap from '@/components/map/RouteMap'
import VietMapWrapper from '@/components/VietMapWrapper'
import { vietmapStyleUrl } from '@/config/vietmap'

export default function VietMapTestScreen() {
  const [status, setStatus] = useState('Initializing...')
  const [apiStatus, setApiStatus] = useState('Checking API...')

  // Sample coordinates for Ho Chi Minh City
  const sampleCoordinates: [number, number][] = [
    [106.6297, 10.8231], // Start point
    [106.7297, 10.8631]  // End point
  ]

  useEffect(() => {
    const checkVietMapAPI = async () => {
      const tilemapKey = process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY
      const servicesKey = process.env.EXPO_PUBLIC_VIETMAP_SERVICES_KEY
      
      if (!tilemapKey || !servicesKey) {
        setApiStatus('❌ API Keys not found')
        setStatus('Missing VietMap API keys')
        return
      }

      setApiStatus('✅ Both keys loaded (Tilemap + Services)')
      
      try {
        // Test tilemap with Tilemap Key
        const lightStyleUrl = `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${tilemapKey}`
        
        const response = await fetch(lightStyleUrl)
        if (response.ok) {
          const data = await response.json()
          setStatus(`✅ VietMap API working: ${data.name || 'Light Style'}`)
        } else {
          setStatus(`❌ API Error: ${response.status}`)
        }
      } catch (error) {
        setStatus(`❌ Network Error: ${error?.message || 'Unknown error'}`)
      }
    }

    checkVietMapAPI()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.container}>
<View style={styles.header}>
<Text style={styles.title}>🗺️ VietMap Integration Test</Text>
<Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
</View>
<View style={styles.statusCard}>
<Text style={styles.cardTitle}>📡 API Status</Text>
<Text style={styles.statusText}>{apiStatus}</Text>
<Text style={styles.statusText}>{status}</Text>
</View>
<View style={styles.infoCard}>
<Text style={styles.cardTitle}>📋 VietMap Implementation</Text>
<Text style={styles.infoText}>• Web: VietMap GL JS (CDN)</Text>
<Text style={styles.infoText}>• Mobile: @vietmap/vietmap-gl-react-native</Text>
<Text style={styles.infoText}>• Platform Support: iOS, Android, Web</Text>
<Text style={styles.infoText}>• Navigation: Mobile only</Text>
</View>
<View style={styles.mapCard}>
<Text style={styles.cardTitle}>🗺️ RouteMap Component</Text>
<Text style={styles.infoText}>Production VietMap integration:</Text>
<RouteMap
          coordinates={sampleCoordinates}
          style={{ height: 300, marginTop: 12, borderRadius: 12 }}
          styleURL={vietmapStyleUrl('light')}
          showOverviewMarkers={true}
          startMarker={sampleCoordinates[0]}
          endMarker={sampleCoordinates[1]}
        />
</View>
<View style={styles.wrapperCard}>
<Text style={styles.cardTitle}>🛠️ VietMapWrapper Component</Text>
<Text style={styles.infoText}>Complete wrapper with navigation controls:</Text>
<VietMapWrapper
          coordinates={sampleCoordinates}
          style={{ marginTop: 12 }}
          styleURL={vietmapStyleUrl('light')}
          showControls={true}
        />
</View>
<View style={styles.nextSteps}>
<Text style={styles.cardTitle}>✅ Integration Complete</Text>
<Text style={styles.stepText}>✓ Platform-specific SDK selection</Text>
<Text style={styles.stepText}>✓ Web: VietMap GL JS via CDN</Text>
<Text style={styles.stepText}>✓ Mobile: Native VietMap SDK</Text>
<Text style={styles.stepText}>✓ Production-ready components</Text>
</View>
</ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280'
  },
  statusCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B'
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  mapCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  wrapperCard: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981'
  },
  nextSteps: {
    backgroundColor: '#EDE9FE',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827'
  },
  statusText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  urlText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2
  },
  stepText: {
    fontSize: 14,
    color: '#5B21B6',
    marginBottom: 4
  }
})