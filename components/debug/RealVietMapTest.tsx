import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Platform } from 'react-native'

// Import VietMap components
let VietmapGL: any = null
let packageError: string | null = null

try {
  if (Platform.OS !== 'web') {
    // Check if we're in Expo Go (which doesn't support native modules)
    const Constants = require('expo-constants').default
    const isExpoGo = Constants.appOwnership === 'expo'
    
    if (isExpoGo) {
      packageError = 'Expo Go does not support native modules. Use development build or eject.'
    } else {
      VietmapGL = require('@vietmap/vietmap-gl-react-native')
    }
  }
} catch (error) {
  console.log('VietMap package error:', error)
  packageError = error.message || 'VietMap package initialization failed'
}

const RealVietMapTest: React.FC = () => {
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = process.env.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
<Text style={styles.title}>🌐 Web Platform Detected</Text>
<View style={styles.webMessage}>
<Text style={styles.messageText}>
            VietMap React Native package is designed for mobile platforms.
            Use MapLibre GL JS for web implementation.
          </Text>
</View>
</View>
    )
  }

  // VietMap package issues
  if (!VietmapGL || packageError) {
    return (
      <View style={styles.container}>
<Text style={styles.title}>⚠️ VietMap Native Module Issue</Text>
<View style={styles.warningMessage}>
<Text style={styles.messageTitle}>Detected Issue:</Text>
<Text style={styles.messageText}>{packageError || 'Package not available'}</Text>
<Text style={styles.messageTitle}>Solutions:</Text>
<Text style={styles.solutionText}>1. Create development build:</Text>
<Text style={styles.codeText}>npx expo run:ios</Text>
<Text style={styles.codeText}>npx expo run:android</Text>
<Text style={styles.solutionText}>2. Or use EAS Build:</Text>
<Text style={styles.codeText}>eas build --profile development</Text>
<Text style={styles.solutionText}>3. Package info:</Text>
<Text style={styles.infoText}>• Package: @vietmap/vietmap-gl-react-native</Text>
<Text style={styles.infoText}>• Version: ^2.3.2 ✅ Installed</Text>
<Text style={styles.infoText}>• Requires: Native code compilation</Text>
</View>
</View>
    )
  }

  // No API key
  if (!apiKey) {
    return (
      <View style={styles.container}>
<Text style={styles.title}>🔑 API Key Required</Text>
<View style={styles.errorMessage}>
<Text style={styles.messageText}>
            VietMap API key is required. Please check your .env.local file.
          </Text>
</View>
</View>
    )
  }

  const handleMapReady = () => {
    console.log('✅ VietMap is ready!')
    setMapReady(true)
  }

  const handleMapError = (error: any) => {
    console.error('❌ VietMap error:', error)
    setError(error.message || 'Unknown map error')
  }

  // VietMap URLs from README
  const vietmapStyle = `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${apiKey}`

  try {
    return (
      <View style={styles.container}>
<Text style={styles.title}>🗺️ Real VietMap Component</Text>
<View style={styles.mapContainer}>
<VietmapGL.MapView
            style={styles.map}
            styleURL={vietmapStyle}
            onDidFinishLoadingMap={handleMapReady}
            onDidFailLoadingMap={handleMapError}
          >
            {/* Set camera to Ho Chi Minh City */}
            <VietmapGL.Camera
              centerCoordinate={[106.8019, 10.8412]}
              zoomLevel={12}
              animationMode="easeTo"
              animationDuration={2000}
            />

            {/* Add a marker */}
            <VietmapGL.PointAnnotation
              id="hcmc-marker"
              coordinate={[106.8019, 10.8412]}
            >
<View style={styles.marker}>
<Text style={styles.markerText}>📍</Text>
</View>
</VietmapGL.PointAnnotation>
</VietmapGL.MapView>

          {!mapReady && (
            <View style={styles.loadingOverlay}>
<Text style={styles.loadingText}>Loading VietMap...</Text>
</View>
          )}
{error && (
            <View style={styles.errorOverlay}>
<Text style={styles.errorText}>Error: {error}</Text>
</View>
          )}
        </View>
<View style={styles.info}>
<Text style={styles.infoTitle}>Map Status:</Text>
<Text style={styles.infoText}>
            {mapReady ? '✅ Map loaded successfully' : '⏳ Loading map...'}
          </Text>
<Text style={styles.infoText}>📍 Center: Ho Chi Minh City</Text>
<Text style={styles.infoText}>🔍 Zoom: Level 12</Text>
</View>
</View>
    )
  } catch (renderError) {
    return (
      <View style={styles.container}>
<Text style={styles.title}>❌ Render Error</Text>
<View style={styles.errorMessage}>
<Text style={styles.messageText}>
            Error rendering VietMap: {renderError.message}
          </Text>
</View>
</View>
    )
  }
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
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30
  },
  markerText: {
    fontSize: 20
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  errorOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 8,
    borderRadius: 6
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center'
  },
  webMessage: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444'
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20
  },
  info: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2
  },
  warningMessage: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B'
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 8,
    marginBottom: 4
  },
  solutionText: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 6,
    marginBottom: 2,
    fontWeight: '600'
  },
  codeText: {
    fontSize: 12,
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  }
})

export default RealVietMapTest