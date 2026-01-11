import React from 'react'
import { Platform, View, Text } from 'react-native'
import Constants from 'expo-constants'

// Conditional wrapper to avoid importing the native VietMap module on web, which crashes bundling.
// On web we provide lightweight placeholder components so the rest of the app can render gracefully.

// Detect Expo Go to avoid importing native module which isn't registered there
const isExpoGo = Constants?.appOwnership === 'expo'

let NativeModule: any = null
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    // Defer static analysis by bundlers to avoid including the native module on unsupported platforms
    // eslint-disable-next-line no-eval
    const req = eval('require') as (name: string) => any
    const moduleName = '@vietmap/vietmap-gl-react-native'
    NativeModule = req(moduleName)
  } catch (e) {
    // Fallback empty object if module not installed yet
    NativeModule = {}
  }
}

// Placeholder primitives for web/Expo Go with better route display info
const Placeholder = ({ children, style }: any) => (
  <View style={[{ 
    backgroundColor: '#f5f5f5', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  }, style]}>
<Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
      {Platform.OS === 'web' ? '🌐 VietMap Web' : '📱 VietMap Native SDK cần development build'}
    </Text>
<Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', paddingHorizontal: 16 }}>
      {Platform.OS === 'web' 
        ? 'Sử dụng VietMap Web SDK qua RouteMap component'
        : 'Chạy: eas build --profile development --platform android'
      }
    </Text>
    {children}
  </View>
)
const NoOp = () => null

// Export the appropriate module based on platform
const VietMapGLWrapper = Platform.OS === 'web' || isExpoGo
  ? {
      MapView: Placeholder,
      Camera: NoOp,
      ShapeSource: NoOp,
      LineLayer: NoOp,
      CircleLayer: NoOp,
      PointAnnotation: NoOp,
      // User location related placeholders
      UserLocation: NoOp,
      LocationManager: { start: () => {}, stop: () => {} },
      UserTrackingMode: { Follow: 'follow', FollowWithHeading: 'followWithHeading' },
      // Additional components used in RouteLayer and other components
      Marker: NoOp,
      Source: NoOp,
      Layer: NoOp
    }
  : (NativeModule || {})

export default VietMapGLWrapper
