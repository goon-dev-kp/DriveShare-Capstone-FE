import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { VehicleMarker } from './VehicleMarker'

interface Driver {
  id: string
  name: string
  position: [number, number]
  bearing: number
  speed: number
  status: 'active' | 'idle' | 'offline'
  currentTrip?: string
}

interface MultiDriverMapOverlayProps {
  drivers: Driver[]
  selectedDriverId?: string | null
  onDriverSelect: (driverId: string) => void
  style?: any
}

export default function MultiDriverMapOverlay({
  drivers,
  selectedDriverId,
  onDriverSelect,
  style
}: MultiDriverMapOverlayProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'offline'>('all')

  const filteredDrivers = filterStatus === 'all' 
    ? drivers 
    : drivers.filter(d => d.status === filterStatus)

  const getStatusColor = (status: string): string => {
    const map: Record<string, string> = {
      active: '#10B981',
      idle: '#F59E0B',
      offline: '#6B7280'
    }
    return map[status] || '#6B7280'
  }

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      active: 'Đang chạy',
      idle: 'Chờ',
      offline: 'Offline'
    }
    return map[status] || status
  }

  const selectedDriver = drivers.find(d => d.id === selectedDriverId)

  return (
    <View style={[styles.container, style]}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
<Text style={styles.filterTitle}>Lọc tài xế:</Text>
<ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          {['all', 'active', 'idle', 'offline'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status as any)}
              activeOpacity={0.7}
            >
<Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}
              >
                {status === 'all' ? 'Tất cả' : getStatusLabel(status)}
              </Text>
</TouchableOpacity>
          ))}
        </ScrollView>
</View>

      {/* Driver List */}
      <ScrollView 
        style={styles.driverList}
        contentContainerStyle={styles.driverListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDrivers.map((driver) => (
          <TouchableOpacity
            key={driver.id}
            style={[
              styles.driverCard,
              selectedDriverId === driver.id && styles.driverCardSelected
            ]}
            onPress={() => onDriverSelect(driver.id)}
            activeOpacity={0.7}
          >
<View style={styles.driverHeader}>
<View style={styles.driverInfo}>
<Text style={styles.driverName}>{driver.name}</Text>
<View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) + '22' }]}>
<View style={[styles.statusDot, { backgroundColor: getStatusColor(driver.status) }]} />
<Text style={[styles.statusText, { color: getStatusColor(driver.status) }]}>
                    {getStatusLabel(driver.status)}
                  </Text>
</View>
</View>
<Text style={styles.speedText}>{driver.speed} km/h</Text>
</View>
            {driver.currentTrip && (
              <Text style={styles.tripText}>📍 {driver.currentTrip}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Driver Detail Card */}
      {selectedDriver && (
        <View style={styles.detailCard}>
<View style={styles.detailHeader}>
<Text style={styles.detailTitle}>🚗 {selectedDriver.name}</Text>
<TouchableOpacity
              onPress={() => onDriverSelect('')}
              activeOpacity={0.7}
            >
<Text style={styles.closeButton}>×</Text>
</TouchableOpacity>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>📍 Vị trí:</Text>
<Text style={styles.detailValue}>
              {selectedDriver.position[1].toFixed(4)}, {selectedDriver.position[0].toFixed(4)}
            </Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>⚡ Tốc độ:</Text>
<Text style={styles.detailValue}>{selectedDriver.speed} km/h</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>🧭 Hướng:</Text>
<Text style={styles.detailValue}>{selectedDriver.bearing}°</Text>
</View>
          {selectedDriver.currentTrip && (
            <View style={styles.detailRow}>
<Text style={styles.detailLabel}>🎯 Chuyến:</Text>
<Text style={styles.detailValue}>{selectedDriver.currentTrip}</Text>
</View>
          )}
        </View>
      )}
{/* Stats Summary */}
      <View style={styles.statsContainer}>
<View style={styles.statItem}>
<Text style={styles.statValue}>{drivers.length}</Text>
<Text style={styles.statLabel}>Tổng</Text>
</View>
<View style={styles.statItem}>
<Text style={[styles.statValue, { color: '#10B981' }]}>
            {drivers.filter(d => d.status === 'active').length}
          </Text>
<Text style={styles.statLabel}>Đang chạy</Text>
</View>
<View style={styles.statItem}>
<Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {drivers.filter(d => d.status === 'idle').length}
          </Text>
<Text style={styles.statLabel}>Chờ</Text>
</View>
<View style={styles.statItem}>
<Text style={[styles.statValue, { color: '#6B7280' }]}>
            {drivers.filter(d => d.status === 'offline').length}
          </Text>
<Text style={styles.statLabel}>Offline</Text>
</View>
</View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  filterContainer: {
    marginBottom: 12
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  filterButtonTextActive: {
    color: 'white'
  },
  driverList: {
    maxHeight: 200
  },
  driverListContent: {
    gap: 8
  },
  driverCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  driverCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    borderWidth: 2
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  driverInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6'
  },
  tripText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4
  },
  detailCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F59E0B'
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E'
  },
  closeButton: {
    fontSize: 24,
    color: '#92400E',
    fontWeight: '700'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  detailLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '400'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937'
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2
  }
})
