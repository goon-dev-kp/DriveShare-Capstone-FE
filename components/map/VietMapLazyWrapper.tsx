import React, { Suspense, lazy } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'

// Lazy load VietMap components to avoid prototype issues
const VietMapNativeRouteMapLazy = lazy(() => import('./VietMapNativeRouteMap'))
const GPSNavigationLazy = lazy(() => import('./GPSNavigation'))
const VietMapGPSExampleLazy = lazy(() => import('../debug/VietMapGPSExample'))

interface VietMapWrapperProps {
  component: 'route' | 'gps' | 'example'
  coordinates?: [number, number][]
  style?: any
  showUserLocation?: boolean
  navigationActive?: boolean
  onLocationUpdate?: (pos: any) => void
  [key: string]: any
}

const LoadingFallback = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F3F4F6'
  }}>
<ActivityIndicator size="large" color="#3B82F6" />
<Text style={{ 
      marginTop: 12, 
      fontSize: 14, 
      color: '#6B7280',
      fontWeight: '600'
    }}>
      Loading VietMap...
    </Text>
</View>
)

const ErrorFallback = ({ error }: { error: Error }) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 20
  }}>
<Text style={{ 
      fontSize: 16, 
      color: '#DC2626',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8
    }}>
      VietMap Loading Error
    </Text>
<Text style={{ 
      fontSize: 12, 
      color: '#7F1D1D',
      textAlign: 'center'
    }}>
      {error.message || 'Failed to load VietMap component'}
    </Text>
</View>
)

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error || new Error('Unknown error')} />
    }

    return this.props.children
  }
}

export const VietMapLazyWrapper: React.FC<VietMapWrapperProps> = ({ 
  component, 
  ...props 
}) => {
  const renderComponent = () => {
    const safeProps = {
      coordinates: [],
      style: { flex: 1 },
      showUserLocation: false,
      navigationActive: false,
      ...props
    }
    
    switch (component) {
      case 'route':
        return <VietMapNativeRouteMapLazy {...safeProps} />
      case 'gps':
        return <GPSNavigationLazy {...safeProps} />
      case 'example':
        return <VietMapGPSExampleLazy {...safeProps} />
      default:
        return <Text>Unknown VietMap component</Text>
    }
  }

  return (
    <ErrorBoundary>
<Suspense fallback={<LoadingFallback />}>
        {renderComponent()}
      </Suspense>
</ErrorBoundary>
  )
}

export default VietMapLazyWrapper