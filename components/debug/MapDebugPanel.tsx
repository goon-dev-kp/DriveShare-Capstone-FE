import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native'

export interface DebugInfo {
  routeCoords?: number
  startPoint?: [number, number] | null
  endPoint?: [number, number] | null
  tripId?: string
  navActive?: boolean
  currentPos?: [number, number] | null
  speed?: number
  eta?: string
  remaining?: number
  [key: string]: any
}

interface MapDebugPanelProps {
  info: DebugInfo
  visible?: boolean
}

const MapDebugPanel: React.FC<MapDebugPanelProps> = ({ info, visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible)

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={() => setIsVisible(true)}
      >
<Text style={styles.debugButtonText}>🐛 Debug</Text>
</TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsVisible(false)}
    >
<View style={styles.modalOverlay}>
<View style={styles.modalContent}>
<View style={styles.header}>
<Text style={styles.title}>🐛 Map Debug Panel</Text>
<TouchableOpacity 
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
<Text style={styles.closeText}>✕</Text>
</TouchableOpacity>
</View>
<ScrollView style={styles.scrollView}>
<DebugSection title="Route Data">
<DebugRow 
                label="Route Points" 
                value={info.routeCoords || 0}
                status={info.routeCoords && info.routeCoords > 0 ? 'ok' : 'error'}
              />
<DebugRow 
                label="Start Point" 
                value={info.startPoint ? info.startPoint.join(', ') : 'Not set'}
                status={info.startPoint ? 'ok' : 'warning'}
              />
<DebugRow 
                label="End Point" 
                value={info.endPoint ? info.endPoint.join(', ') : 'Not set'}
                status={info.endPoint ? 'ok' : 'warning'}
              />
</DebugSection>

            {info.navActive !== undefined && (
              <DebugSection title="Navigation">
<DebugRow 
                  label="Nav Active" 
                  value={info.navActive ? 'Yes' : 'No'}
                  status={info.navActive ? 'ok' : 'info'}
                />
<DebugRow 
                  label="Current Position" 
                  value={info.currentPos ? info.currentPos.join(', ') : 'Not available'}
                  status={info.currentPos ? 'ok' : 'warning'}
                />
<DebugRow 
                  label="Speed" 
                  value={info.speed !== undefined ? `${Math.round(info.speed * 3.6)} km/h` : 'N/A'}
                  status={info.speed ? 'ok' : 'info'}
                />
<DebugRow 
                  label="ETA" 
                  value={info.eta || 'N/A'}
                  status={info.eta ? 'ok' : 'info'}
                />
<DebugRow 
                  label="Remaining" 
                  value={info.remaining !== undefined ? `${Math.round(info.remaining)}m` : 'N/A'}
                  status={info.remaining !== undefined ? 'ok' : 'info'}
                />
</DebugSection>
            )}

            <DebugSection title="Trip Info">
<DebugRow 
                label="Trip ID" 
                value={info.tripId || 'Not set'}
                status={info.tripId ? 'ok' : 'error'}
              />
</DebugSection>
<DebugSection title="Environment">
<DebugRow 
                label="Platform" 
                value={require('react-native').Platform.OS}
                status="info"
              />
<DebugRow 
                label="Timestamp" 
                value={new Date().toLocaleTimeString()}
                status="info"
              />
</DebugSection>

            {/* Additional custom fields */}
            {Object.keys(info).filter(key => 
              !['routeCoords', 'startPoint', 'endPoint', 'tripId', 'navActive', 'currentPos', 'speed', 'eta', 'remaining'].includes(key)
            ).length > 0 && (
              <DebugSection title="Additional Info">
                {Object.entries(info)
                  .filter(([key]) => !['routeCoords', 'startPoint', 'endPoint', 'tripId', 'navActive', 'currentPos', 'speed', 'eta', 'remaining'].includes(key))
                  .map(([key, value]) => (
                    <DebugRow 
                      key={key}
                      label={key}
                      value={JSON.stringify(value)}
                      status="info"
                    />
                  ))
                }
              </DebugSection>
            )}
          </ScrollView>
</View>
</View>
</Modal>
  )
}

const DebugSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
<Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
)

const DebugRow: React.FC<{ 
  label: string
  value: string | number
  status?: 'ok' | 'warning' | 'error' | 'info'
}> = ({ label, value, status = 'info' }) => {
  const statusColors = {
    ok: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#6B7280'
  }

  const statusIcons = {
    ok: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  }

  return (
    <View style={styles.row}>
<View style={styles.rowLeft}>
<Text style={styles.icon}>{statusIcons[status]}</Text>
<Text style={styles.label}>{label}</Text>
</View>
<Text style={[styles.value, { color: statusColors[status] }]}>
        {value}
      </Text>
</View>
  )
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  closeButton: {
    padding: 4
  },
  closeText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300'
  },
  scrollView: {
    padding: 16
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  icon: {
    fontSize: 16,
    marginRight: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'right',
    maxWidth: '50%'
  }
})

export default MapDebugPanel
