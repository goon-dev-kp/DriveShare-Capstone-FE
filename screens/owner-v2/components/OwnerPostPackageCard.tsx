

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons'
import { FreightPost } from '@/models/types'

interface Props {
  post: FreightPost
  onView?: (postId: string) => void
  onAccept?: (postId: string) => void
  getStatusColor?: (status: string) => string
  onRefresh?: () => void
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try { return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) } 
  catch { return 'Invalid' }
}

// Default status color function
const defaultGetStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return '#10B981'
    case 'ACCEPTED': return '#3B82F6'
    case 'CLOSED': return '#6B7280'
    case 'EXPIRED': return '#EF4444'
    default: return '#F59E0B'
  }
}

// Màu sắc chủ đạo
const COLORS = {
  primary: '#0284C7',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  bg: '#FFFFFF',
  success: '#10B981',
  danger: '#EF4444',
}

const OwnerPostPackageCard: React.FC<Props> = ({ post, onView, onAccept, getStatusColor, onRefresh }) => {
  const statusColorFn = getStatusColor || defaultGetStatusColor
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onView?.(post.id)}
      activeOpacity={0.9}
    >
      {/* HEADER: Title & Price */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
          <Text style={styles.subTitle}>{post.packageDetails?.title ?? 'Gói hàng'}</Text>
        </View>
        <View>
          <Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(post.offeredPrice)} đ</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', alignSelf: 'flex-end', marginTop: 4 }]}>
             <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>OPEN</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ROUTE INFO */}
      <View style={styles.routeContainer}>
        {/* From */}
        <View style={styles.routeRow}>
          <MaterialCommunityIcons name="circle-slice-8" size={16} color={COLORS.primary} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.routeLabel}>Điểm đi ({formatDate(post.shippingRoute?.expectedPickupDate)})</Text>
            <Text style={styles.routeText} numberOfLines={1}>{post.shippingRoute?.startLocation}</Text>
          </View>
        </View>
        
        {/* Line */}
        <View style={styles.connector}>
          <View style={styles.dashedLine} />
        </View>

        {/* To */}
        <View style={styles.routeRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.danger} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.routeLabel}>Điểm đến ({formatDate(post.shippingRoute?.expectedDeliveryDate)})</Text>
            <Text style={styles.routeText} numberOfLines={1}>{post.shippingRoute?.endLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <View style={styles.metaInfo}>
           <Feather name="package" size={14} color={COLORS.textLight} />
           <Text style={styles.metaText}>{post.packageDetails?.quantity || 1} kiện</Text>
        </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => onView?.(post.id)} style={styles.iconBtn}>
                  <Feather name="eye" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4, // Tạo khoảng cách nhỏ 2 bên để shadow đẹp hơn
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  subTitle: { fontSize: 13, color: COLORS.textLight },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  routeContainer: { gap: 0 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  routeText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  connector: { marginLeft: 7, height: 16, borderLeftWidth: 1, borderLeftColor: COLORS.border, borderStyle: 'dashed', marginVertical: 2 },
  dashedLine: { width: 1, height: '100%' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textLight },
  
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
})

export default OwnerPostPackageCard