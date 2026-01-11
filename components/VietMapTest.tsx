import React from 'react'
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import VietMapWrapper, { isVietMapAvailable, isNavigationAvailable } from './VietMapWrapper'

// Enhanced test component with navigation to full test screen
const VietMapTest: React.FC = () => {
  const router = useRouter()
  
  const sampleCoordinates: [number, number][] = [
    [106.6297, 10.8231], // Ho Chi Minh City center
  ]

  const goToNavigationTest = () => {
    router.push('/navigation-test')
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>VietMap Integration</Text>
          <Text style={styles.subtitle}>Bản đồ & Dẫn đường 3D</Text>
        </View>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={goToNavigationTest}
        >
          <Text style={styles.testButtonText}>🧭 Test Navigation</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: Platform.OS === 'web' ? '#3B82F6' : '#10B981' }]}>
          <Text style={styles.statusText}>📱 {Platform.OS}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isVietMapAvailable() ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>🗺️ {isVietMapAvailable() ? 'Available' : 'Unavailable'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isNavigationAvailable() ? '#10B981' : '#F59E0B' }]}>
          <Text style={styles.statusText}>🧭 {isNavigationAvailable() ? 'Ready' : 'Limited'}</Text>
        </View>
      </View>
      
      <VietMapWrapper
        coordinates={sampleCoordinates}
        style={styles.mapContainer}
        showControls={true}
      />
      
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>🚀 Tính năng dẫn đường</Text>
        <Text style={styles.infoText}>• GPS theo thời gian thực</Text>
        <Text style={styles.infoText}>• Dẫn đường giọng nói tiếng Việt</Text>
        <Text style={styles.infoText}>• Tương thích web & mobile</Text>
        <Text style={styles.infoText}>• Navigation 3D với VietMap SDK</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'System'
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#60A5FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'System'
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System'
  },
  mapContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'System'
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
    fontFamily: 'System'
  }
})

export default VietMapTest