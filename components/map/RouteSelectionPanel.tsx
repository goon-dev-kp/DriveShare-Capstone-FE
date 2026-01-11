import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'

interface Route {
  id: string
  coordinates: [number, number][]
  color: string
  label: string
  visible: boolean
  distance?: number
  estimatedTime?: string
}

interface RouteSelectionPanelProps {
  routes: Route[]
  selectedRouteId?: string
  onRouteToggle: (routeId: string) => void
  onRouteSelect: (routeId: string) => void
  style?: any
}

export const RouteSelectionPanel: React.FC<RouteSelectionPanelProps> = ({
  routes,
  selectedRouteId,
  onRouteToggle,
  onRouteSelect,
  style
}) => {
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  return (
    <View style={[styles.container, style]}>
<View style={styles.header}>
<Text style={styles.title}>🛣️ Tuyến đường</Text>
<Text style={styles.subtitle}>Chọn tuyến để xem chi tiết</Text>
</View>
<ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Danh sách tuyến đường"
      >
        {routes.map((route, index) => {
          const isSelected = selectedRouteId === route.id
          const isVisible = route.visible
          
          return (
            <View 
              key={route.id} 
              style={styles.routeCard}
              accessible={true}
            >
              {/* Route Header */}
              <View style={styles.routeHeader}>
<TouchableOpacity
                  style={[
                    styles.routeColorBadge,
                    { backgroundColor: route.color },
                    !isVisible && styles.routeColorBadgeHidden
                  ]}
                  onPress={() => onRouteToggle(route.id)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${isVisible ? 'Ẩn' : 'Hiện'} tuyến ${route.label}`}
                  accessibilityHint="Chạm để bật/tắt hiển thị tuyến đường"
                >
<Text style={styles.routeColorText}>
                    {isVisible ? '●' : '○'}
                  </Text>
</TouchableOpacity>
<TouchableOpacity
                  style={[styles.routeLabelContainer, { flex: 1 }]}
                  onPress={() => onRouteSelect(route.id)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn tuyến ${route.label}${route.distance ? `, khoảng cách ${formatDistance(route.distance)}` : ''}${route.estimatedTime ? `, thời gian ${route.estimatedTime}` : ''}`}
                  accessibilityHint="Chạm để chọn và xem chi tiết tuyến đường"
                >
<Text style={[
                    styles.routeLabel,
                    isSelected && styles.routeLabelSelected,
                    !isVisible && styles.routeLabelFaded
                  ]}>
                    {route.label}
                  </Text>
                  
                  {/* Route Stats */}
                  <View style={styles.routeStats}>
                    {route.distance && (
                      <Text style={[
                        styles.routeStat,
                        !isVisible && styles.routeStatFaded
                      ]}>
                        📏 {formatDistance(route.distance)}
                      </Text>
                    )}
                    {route.estimatedTime && (
                      <Text style={[
                        styles.routeStat,
                        !isVisible && styles.routeStatFaded
                      ]}>
                        ⏱️ {route.estimatedTime}
                      </Text>
                    )}
                  </View>
</TouchableOpacity>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <View 
                    style={styles.selectedIndicator}
                    accessible={true}
                    accessibilityLabel="Tuyến đã chọn"
                  >
<Text style={styles.selectedText}>✓</Text>
</View>
                )}
              </View>
              
              {/* Route Details when selected */}
              {isSelected && (
                <View 
                  style={styles.routeDetails}
                  accessible={true}
                  accessibilityLabel={`Chi tiết tuyến ${route.label}`}
                >
<Text style={styles.routeDetailsText}>
                    Tuyến đường được chọn - {route.coordinates.length} điểm
                  </Text>
<View style={styles.routeActions}>
<TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onRouteSelect(route.id)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Xem chi tiết tuyến ${route.label}`}
                      accessibilityHint="Chạm để xem thông tin chi tiết về tuyến đường"
                    >
<Text style={styles.actionButtonText}>📍 Xem chi tiết</Text>
</TouchableOpacity>
</View>
</View>
              )}
            </View>
          )
        })}
{routes.length === 0 && (
          <View style={styles.emptyState}>
<Text style={styles.emptyText}>🚫 Không có tuyến đường nào</Text>
<Text style={styles.emptySubtext}>
              Thêm tuyến đường để bắt đầu điều hướng
            </Text>
</View>
        )}
      </ScrollView>
      
      {/* Quick Actions */}
      <View 
        style={styles.footer}
        accessible={true}
        accessibilityLabel="Thao tác nhanh"
      >
<TouchableOpacity
          style={styles.footerButton}
          onPress={() => routes.forEach(r => onRouteToggle(r.id))}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Hiện tất cả tuyến đường"
          accessibilityHint="Chạm để hiển thị tất cả tuyến đường trên bản đồ"
        >
<Text style={styles.footerButtonText}>👁️ Hiện tất cả</Text>
</TouchableOpacity>
<TouchableOpacity
          style={styles.footerButton}
          onPress={() => routes.forEach(r => onRouteToggle(r.id))}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Ẩn tất cả tuyến đường"
          accessibilityHint="Chạm để ẩn tất cả tuyến đường trên bản đồ"
        >
<Text style={styles.footerButtonText}>🚫 Ẩn tất cả</Text>
</TouchableOpacity>
</View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 400
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280'
  },
  scrollView: {
    maxHeight: 250
  },
  routeCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  routeColorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  routeColorBadgeHidden: {
    opacity: 0.3
  },
  routeColorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  routeLabelContainer: {
    flex: 1
  },
  routeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  routeLabelSelected: {
    color: '#3B82F6'
  },
  routeLabelFaded: {
    color: '#9CA3AF'
  },
  routeStats: {
    flexDirection: 'row',
    gap: 12
  },
  routeStat: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  routeStatFaded: {
    color: '#D1D5DB'
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  routeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  routeDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60A5FA'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center'
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  footerButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151'
  }
})

export default RouteSelectionPanel