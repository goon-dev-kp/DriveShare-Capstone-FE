import React, { useEffect, useState } from 'react'
import { View, Button, Alert, StyleSheet, Platform } from 'react-native'
import RouteMap from '@/components/map/RouteMap'
import VietMapWebSDK from '@/components/debug/VietMapWebSDK'

// VietMap Wrapper provides platform-specific VietMap integration
// - Web: Uses VietMap Web SDK (CDN-loaded)
// - Mobile: Uses VietMap React Native SDK with proper navigation support

let VietmapGL: any = null
let NavigationController: any = null

// Only load VietMap modules on native platforms to avoid Metro bundling issues on web
const loadVietMapModules = () => {
  if (Platform.OS === 'web') return
  
  // We'll load these dynamically only when actually needed on mobile
  // This avoids Metro trying to bundle them for web
}

export const isVietMapAvailable = () => {
  if (Platform.OS === 'web') return true // Web SDK loaded via CDN
  
  // For mobile, we assume VietMap is available if the package is installed
  // Actual loading happens in development builds
  return true
}

export const isNavigationAvailable = () => {
  if (Platform.OS === 'web') return false // Web doesn't support turn-by-turn navigation
  
  // Navigation requires development build on mobile platforms
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

export const startNavigation = async (route?: any) => {
  if (Platform.OS === 'web') {
    Alert.alert('Navigation', 'Turn-by-turn navigation not supported on web. Use RouteMap for route display.')
    return false
  }
  
  Alert.alert(
    'Navigation', 
    'Turn-by-turn navigation requires development build with VietMap Navigation SDK. Use RouteMap for route display.'
  )
  return false
}

export const stopNavigation = () => {
  if (Platform.OS === 'web') return false
  
  Alert.alert('Navigation', 'Navigation control requires development build.')
  return false
}

interface Props {
  routeData?: string | null
  coordinates?: [number, number][]
  style?: any
  showControls?: boolean
  styleURL?: string
  showUserLocation?: boolean
  followUserLocation?: boolean
  navigationActive?: boolean
}

const VietMapWrapper: React.FC<Props> = ({ 
  routeData, 
  coordinates,
  style, 
  showControls = true,
  styleURL,
  showUserLocation = false,
  followUserLocation = false,
  navigationActive = false
}) => {
  const [vietmapAvailable, setVietmapAvailable] = useState<boolean>(false)
  const [navAvailable, setNavAvailable] = useState<boolean>(false)

  useEffect(() => {
    setVietmapAvailable(isVietMapAvailable())
    setNavAvailable(isNavigationAvailable())
    
    // Call the load function (currently no-op, but ready for future use)
    loadVietMapModules()
  }, [])

  const onStart = async () => {
    const ok = await startNavigation()
    if (!ok) {
      Alert.alert(
        'Navigation', 
        Platform.OS === 'web' 
          ? 'Turn-by-turn navigation requires mobile app with development build.'
          : 'Navigation controller not available. Ensure VietMap Navigation SDK is installed.'
      )
    }
  }
  
  const onStop = () => {
    const ok = stopNavigation()
    if (!ok) {
      Alert.alert('Navigation', 'Stop failed or navigation controller not available')
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={style}>
<VietMapWebSDK />
        {showControls && (
          <View style={styles.controls}>
<Button title="Web Navigation" onPress={() => Alert.alert('Info', 'Web platform uses display-only maps')} />
</View>
        )}
      </View>
    )
  }

  return (
    <View style={style}>
<RouteMap
        routeData={routeData}
        coordinates={coordinates}
        style={{ height: 380 }}
        styleURL={styleURL}
        showUserLocation={showUserLocation}
        followUserLocation={followUserLocation}
        navigationActive={navigationActive}
      />
      {showControls && (
        <View style={styles.controls}>
<Button title="Start Navigation" onPress={onStart} disabled={!navAvailable} />
<Button title="Stop Navigation" onPress={onStop} disabled={!navAvailable} />
</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 8 }
})

export default VietMapWrapper
