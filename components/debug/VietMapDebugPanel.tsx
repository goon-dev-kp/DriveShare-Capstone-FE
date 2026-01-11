import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

interface VietMapDebugPanelProps {
  apiKey: string
  styleUrl: string
  onTestApiKey: () => void
}

const VietMapDebugPanel: React.FC<VietMapDebugPanelProps> = ({ apiKey, styleUrl, onTestApiKey }) => {
  const keyPreview = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-8)}` : 'No API Key'
  
  const testMapTiles = async () => {
    try {
      // Test map style tiles
      const tileUrl = `https://maps.vietmap.vn/maps/styles/lm/style.json?apikey=${apiKey}`
      const response = await fetch(tileUrl)
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ Map Tiles Test Success!\nStatus: ${response.status}\nStyle loaded: ${data.name || 'VietMap Style'}`)
      } else {
        alert(`❌ Map Tiles Test Failed!\nStatus: ${response.status}\nError: ${data.message || 'Style loading failed'}`)
      }
    } catch (error: any) {
      alert(`❌ Map Tiles Network Error:\n${error.message}`)
    }
  }

  const testRoutingFixed = async () => {
    try {
      // Test với coordinates Việt Nam hợp lệ (HCM -> Hà Nội)
      const testUrl = `https://maps.vietmap.vn/api/route?api_version=1.1&apikey=${apiKey}&point=10.8231,106.6297&point=21.0285,105.8542&vehicle=car`
      const response = await fetch(testUrl)
      const data = await response.json()
      
      if (response.ok && data.paths && data.paths.length > 0) {
        alert(`✅ Routing API Test Success!\nStatus: ${response.status}\nRoutes found: ${data.paths.length}\nDistance: ${Math.round(data.paths[0].distance/1000)}km`)
      } else {
        alert(`❌ Routing API Test Failed!\nStatus: ${response.status}\nError: ${data.messages || data.message || 'No paths returned'}`)
      }
    } catch (error: any) {
      alert(`❌ Routing API Network Error:\n${error.message}`)
    }
  }
  
  return (
    <View style={styles.container}>
<Text style={styles.title}>🔧 VietMap Debug Panel</Text>
<View style={styles.row}>
<Text style={styles.label}>API Key:</Text>
<Text style={styles.value}>{keyPreview}</Text>
</View>
<View style={styles.row}>
<Text style={styles.label}>Style URL:</Text>
<Text style={styles.valueUrl} numberOfLines={2}>{styleUrl}</Text>
</View>
<View style={styles.buttonRow}>
<TouchableOpacity style={[styles.testButton, styles.routingButton]} onPress={testRoutingFixed}>
<Text style={styles.testButtonText}>🗺️ Test Routing</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.testButton, styles.tilesButton]} onPress={testMapTiles}>
<Text style={styles.testButtonText}>🖼️ Test Map Tiles</Text>
</TouchableOpacity>
</View>
<View style={styles.instructions}>
<Text style={styles.instructionText}>
          📝 VietMap Diagnostics:
          {'\n'}✅ API Key: {apiKey ? 'Present' : 'Missing'}
          {'\n'}🗺️ Test Routing: HCM → Hà Nội route
          {'\n'}🖼️ Test Map Tiles: Style loading check
          {'\n'}
          {'\n'}🚨 OSM Fallback causes:
          {'\n'}• Map tiles 401/403 errors
          {'\n'}• Style JSON loading failed  
          {'\n'}• API key expired/invalid
          {'\n'}• CORS issues on web platform
        </Text>
</View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    color: '#92400E',
    width: 80,
  },
  value: {
    flex: 1,
    color: '#1F2937',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  valueUrl: {
    flex: 1,
    color: '#1F2937',
    fontSize: 10,
    lineHeight: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  testButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  routingButton: {
    backgroundColor: '#3B82F6',
  },
  tilesButton: {
    backgroundColor: '#F59E0B',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  instructions: {
    backgroundColor: '#FEF9E7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  instructionText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
})

export default VietMapDebugPanel