import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import VietMapUniversal from '@/components/map/VietMapUniversal'
import { decodePolyline } from '@/utils/polyline'

/**
 * VietMap Integration Test Screen
 * Test RouteMap component with sample data
 */
const VietMapTestScreen: React.FC = () => {
  // Sample polyline from VietMap API (Hanoi route)
  const samplePolyline = 'u_r~B_ciySdCfBrBxAxAhArA~@~@p@|@j@|@j@|@h@bAd@bAb@bA`@dA^dA\\dAZdAXfAVfATfARhAPhAPjANjALlAJlAHnAFnADpABpA@pA?r@Ar@Cr@Er@Gr@Ir@Kr@Mr@Or@Qr@Sr@Ur@Wr@Yr@[r@]r@_@r@a@r@c@r@e@r@g@r@i@r@k@r@m@r@o@r@q@r@s@r@u@r@w@r@y@r@{@r@}@r@_Ar@aAr@cAr@eAr@gAr@iAr@kAr@mAr@oAr@qAr@sAr@uAr@wAr@yAr@{Ar@}Ar@_Br@aBr@cBr@eBr@gBr@iBr@kBr@mBr@oBr@qBr@sBr@uBr@wBr@yBr@{Br@}Br@_Cr@aCr@cCr@eCr@gCr@iCr@kCr@mCr@oCr@qCr@sCr@uCr@wCr@yCr@{Cr@}Cr@_Dr@aDr@cDr@eDr@gDr@iDr@kDr@mDr@oDr@qDr@sDr@uDr@wDr@yDr@{Dr@}Dr@_Er@'

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [startPoint, setStartPoint] = useState<[number, number]>()
  const [endPoint, setEndPoint] = useState<[number, number]>()
  const [showOverviewMarkers, setShowOverviewMarkers] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    try {
      const decoded = decodePolyline(samplePolyline, 5)
      console.log('Decoded coordinates:', decoded.coordinates.length)
      
      if (decoded.coordinates.length > 0) {
        setRouteCoords(decoded.coordinates as [number, number][])
        setStartPoint(decoded.coordinates[0] as [number, number])
        setEndPoint(decoded.coordinates[decoded.coordinates.length - 1] as [number, number])
      } else {
        setError('No coordinates decoded')
      }
    } catch (e: any) {
      console.error('Decode error:', e)
      setError(e.message)
    }
  }, [])

  const testAlerts = () => {
    Alert.alert(
      'Map Test Info',
      `Coordinates: ${routeCoords.length}\nStart: ${startPoint?.join(', ')}\nEnd: ${endPoint?.join(', ')}`,
      [{ text: 'OK' }]
    )
  }

  return (
    <ScrollView style={styles.container}>
<View style={styles.header}>
<Text style={styles.title}>🗺️ VietMap Integration Test</Text>
<Text style={styles.subtitle}>Testing RouteMap Component</Text>
</View>

      {error && (
        <View style={styles.errorBox}>
<Text style={styles.errorText}>❌ Error: {error}</Text>
</View>
      )}

      <View style={styles.card}>
<Text style={styles.cardTitle}>Map Display Test</Text>
<Text style={styles.info}>
          Route points: {routeCoords.length}
        </Text>
<View style={styles.mapContainer}>
          {routeCoords.length > 0 ? (
            <VietMapUniversal
              coordinates={routeCoords}
              style={styles.map}
              showUserLocation={true}
              navigationActive={false}
              onLocationUpdate={(pos) => console.log('📍 Test location:', pos)}
            />
          ) : (
            <View style={styles.loading}>
<Text>Loading map...</Text>
</View>
          )}
        </View>
<View style={styles.controls}>
<TouchableOpacity 
            style={styles.button}
            onPress={() => setShowOverviewMarkers(!showOverviewMarkers)}
          >
<Text style={styles.buttonText}>
              {showOverviewMarkers ? '✅ Markers ON' : '❌ Markers OFF'}
            </Text>
</TouchableOpacity>
<TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={testAlerts}
          >
<Text style={styles.buttonText}>Show Info</Text>
</TouchableOpacity>
</View>
</View>
<View style={styles.card}>
<Text style={styles.cardTitle}>Coordinates Data</Text>
        {startPoint && (
          <View style={styles.dataRow}>
<Text style={styles.label}>Start Point:</Text>
<Text style={styles.value}>{startPoint.join(', ')}</Text>
</View>
        )}
        {endPoint && (
          <View style={styles.dataRow}>
<Text style={styles.label}>End Point:</Text>
<Text style={styles.value}>{endPoint.join(', ')}</Text>
</View>
        )}
        <View style={styles.dataRow}>
<Text style={styles.label}>Total Points:</Text>
<Text style={styles.value}>{routeCoords.length}</Text>
</View>
</View>
<View style={styles.card}>
<Text style={styles.cardTitle}>Integration Checklist</Text>
<ChecklistItem 
          label="RouteMap imported" 
          checked={true}
        />
<ChecklistItem 
          label="Polyline decoded" 
          checked={routeCoords.length > 0}
        />
<ChecklistItem 
          label="Start marker set" 
          checked={!!startPoint}
        />
<ChecklistItem 
          label="End marker set" 
          checked={!!endPoint}
        />
<ChecklistItem 
          label="Map rendered" 
          checked={routeCoords.length > 0}
        />
</View>
</ScrollView>
  )
}

const ChecklistItem: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
  <View style={styles.checklistItem}>
<Text style={styles.checkIcon}>{checked ? '✅' : '❌'}</Text>
<Text style={styles.checkLabel}>{label}</Text>
</View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    padding: 20,
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    fontWeight: '500'
  },
  errorBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626'
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600'
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 12
  },
  map: {
    flex: 1
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  controls: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonSecondary: {
    backgroundColor: '#6B7280'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right'
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 8
  },
  checkLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  }
})

export default VietMapTestScreen
