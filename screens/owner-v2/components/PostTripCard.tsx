import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface PostTripCardProps {
  post: any
  onEdit?: () => void
  onDelete?: () => void
  onView?: (postId: string) => void
  onSign?: (postId: string) => void
  onPay?: (postId: string) => void
  showActions?: boolean
}

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'OPEN': return { bg: '#ECFDF5', text: '#059669', border: '#10B981' }
    case 'AWAITING_SIGNATURE': return { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6' }
    case 'AWAITING_PAYMENT': return { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444' }
    case 'IN_PROGRESS': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#3B82F6' }
    case 'COMPLETED': return { bg: '#F3F4F6', text: '#374151', border: '#6B7280' }
    case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444' }
    default: return { bg: '#FFFBEB', text: '#D97706', border: '#F59E0B' }
  }
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'OPEN': 'Đang mở',
    'PENDING': 'Chờ xử lý',
    'AWAITING_SIGNATURE': 'Chờ ký',
    'AWAITING_PAYMENT': 'Chờ thanh toán',
    'IN_PROGRESS': 'Đang vận chuyển',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'CLOSED': 'Đã đóng',
  }
  return labels[status?.toUpperCase()] || status
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

const PostTripCard: React.FC<PostTripCardProps> = ({ 
  post, 
  onEdit, 
  onDelete, 
  onView, 
  onSign,
  onPay,
  showActions = true 
}) => {
  const style = getStatusColor(post.status)
  const router = useRouter()

  const handleSignPress = () => {
    if (onSign) return onSign(post.postTripId || post.id)
    // Fallback navigation if needed
  }

  const handlePayPress = () => {
    if (onPay) return onPay(post.postTripId || post.id)
    // Fallback navigation if needed
  }

  // Extract trip info
  const trip = post.trip || post.Trip || {}
  const startLocation = trip.startLocationName || trip.StartLocationName || 'N/A'
  const endLocation = trip.endLocationName || trip.EndLocationName || 'N/A'
  const startDate = trip.startDate || trip.StartDate
  const endDate = trip.endDate || trip.EndDate

  // Calculate total price from details
  const details = post.postTripDetails || post.PostTripDetails || []
  const totalDrivers = details.reduce((sum: number, d: any) => {
    return sum + (d.requiredCount || d.RequiredCount || 0)
  }, 0)
  
  const totalPrice = details.reduce((sum: number, d: any) => {
    const count = d.requiredCount || d.RequiredCount || 0
    const price = d.pricePerPerson || d.PricePerPerson || 0
    const bonus = d.bonusAmount || d.BonusAmount || 0
    return sum + (count * (price + bonus))
  }, 0)

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: style.border }]} 
      onPress={() => onView?.(post.postTripId || post.id)}
      activeOpacity={0.9}
    >
      {/* HEADER: Title & Status */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{post.title || post.Title}</Text>
          <Text style={styles.subTitle}>{post.description || post.Description || 'Không có mô tả'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.text }]}>{getStatusLabel(post.status)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ROUTE: Start -> End */}
      <View style={styles.routeContainer}>
        {/* Start */}
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="circle-slice-8" size={16} color="#0284C7" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.routeLabel}>Điểm đón ({formatDate(startDate)})</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>{startLocation}</Text>
          </View>
        </View>
        
        {/* Connector Line */}
        <View style={styles.connector}>
          <View style={styles.dottedLine} />
        </View>

        {/* End */}
        <View style={styles.routeItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.routeLabel}>Điểm trả ({formatDate(endDate)})</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>{endLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{totalDrivers} tài xế</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="truck-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{post.requiredPayloadInKg || post.RequiredPayloadInKg || 0} kg</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* FOOTER: Price & Actions */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Tổng chi phí</Text>
          <Text style={styles.priceValue}>{new Intl.NumberFormat('vi-VN').format(totalPrice)} đ</Text>
        </View>

        {showActions && (
          <View style={styles.actionRow}>
            {/* View / Details */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => onView?.(post.postTripId || post.id)}>
              <Feather name="eye" size={18} color="#374151" />
            </TouchableOpacity>

            {/* Sign - shown only if AWAITING_SIGNATURE */}
            {String(post.status).toUpperCase() === 'AWAITING_SIGNATURE' && (
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#F3E8FF' }]} onPress={handleSignPress}>
                <MaterialCommunityIcons name="signature" size={18} color="#7C3AED" />
              </TouchableOpacity>
            )}

            {/* Pay - shown only if AWAITING_PAYMENT */}
            {String(post.status).toUpperCase() === 'AWAITING_PAYMENT' && (
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#E6F2FF' }]} onPress={handlePayPress}>
                <MaterialCommunityIcons name="cash" size={18} color="#0284C7" />
              </TouchableOpacity>
            )}

            {/* Edit */}
            {onEdit && (
              <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                <Feather name="edit-2" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}

            {/* Delete */}
            {onDelete && (
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FEF2F2' }]} onPress={onDelete}>
                <Feather name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 16,
    padding: 16, 
    borderLeftWidth: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 3,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 4 
  },
  subTitle: { 
    fontSize: 13, 
    color: '#6B7280' 
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  
  divider: { 
    height: 1, 
    backgroundColor: '#F3F4F6', 
    marginVertical: 12 
  },
  
  routeContainer: { gap: 0 },
  routeItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  routeLabel: { 
    fontSize: 11, 
    color: '#9CA3AF', 
    marginBottom: 2 
  },
  routeAddress: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#374151' 
  },
  connector: { 
    marginLeft: 7, 
    height: 16, 
    borderLeftWidth: 1, 
    borderLeftColor: '#E5E7EB', 
    borderStyle: 'dashed', 
    marginVertical: 2 
  },
  dottedLine: { 
    width: 1, 
    height: '100%' 
  },

  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  priceLabel: { 
    fontSize: 11, 
    color: '#6B7280' 
  },
  priceValue: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0284C7' 
  },
  
  actionRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  iconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F9FAFB', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
})

export default PostTripCard
