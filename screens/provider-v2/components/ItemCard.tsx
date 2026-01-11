import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import { Item, ItemStatus } from '../../../models/types'
import { ArchiveBoxArrowDownIcon } from '../icons/ActionIcons'
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onDelete: () => void
  onPack: () => void
  deleting?: boolean
  getStatusColor?: (status: string) => string
}

// Hàm việt hóa status
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'IN_USE': 'Đang dùng',
    'IN_PROGRESS': 'Đang vận chuyển',
    'COMPLETED': 'Hoàn thành',
    'DELETED': 'Đã xóa',
    'PACKAGED': 'Đã đóng gói',
  }
  return statusMap[status] || status
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete, onPack, deleting, getStatusColor }) => {
  const images = (item as any).images ?? (item as any).ItemImages ?? []
  const imageUrl = images.length > 0 ? (images[0].itemImageURL ?? images[0].uri ?? images[0]) : 'https://via.placeholder.com/400'
  const status = item.status ?? ItemStatus.PENDING
  
  // Use custom status color if provided, otherwise use default
  const statusColor = getStatusColor ? getStatusColor(status) : '#F59E0B'
  
  // Chỉ cho phép edit/delete khi status là PENDING
  const canEditOrDelete = status === ItemStatus.PENDING

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageContainer}>
        {Platform.OS === 'web' ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.ribbonContainer} pointerEvents="none">
          <View style={[styles.ribbon, { backgroundColor: statusColor }]}>
            <Text style={styles.ribbonText}>{getStatusText(status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>{item.itemName}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{item.description ?? 'Không có mô tả'}</Text>

        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <MaterialCommunityIcons name="cube-outline" size={18} color="#10B981" />
            <Text style={styles.specValue}>{item.unit ?? '-'}</Text>
            <Text style={styles.specLabel}>Đơn vị</Text>
          </View>
          <View style={styles.specItem}>
            <MaterialCommunityIcons name="numeric" size={18} color="#10B981" />
            <Text style={styles.specValue}>{item.quantity ?? '-'}</Text>
            <Text style={styles.specLabel}>Số lượng</Text>
          </View>
          <View style={styles.specItem}>
            <MaterialCommunityIcons name="cash" size={18} color="#10B981" />
            <Text style={styles.specValue}>{new Intl.NumberFormat('vi-VN').format(item.declaredValue ?? 0)}</Text>
            <Text style={styles.specLabel}>Giá</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.iconGroup}>
            <TouchableOpacity 
              onPress={onEdit} 
              style={[styles.iconButton, !canEditOrDelete && styles.iconButtonDisabled]} 
              disabled={!canEditOrDelete}
            >
              <Feather name="edit-2" size={16} color={canEditOrDelete ? "#6B7280" : "#D1D5DB"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onDelete} 
              style={[styles.iconButton, (!canEditOrDelete || deleting) && styles.iconButtonDisabled]} 
              disabled={!canEditOrDelete || Boolean(deleting)}
            >
              {deleting ? <ActivityIndicator size="small" color="#EF4444" /> : <Feather name="trash-2" size={16} color={canEditOrDelete ? "#EF4444" : "#D1D5DB"} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onPack} style={[styles.packButton, status !== ItemStatus.PENDING && styles.packButtonDisabled]} disabled={status !== ItemStatus.PENDING}>
            <ArchiveBoxArrowDownIcon style={styles.packIcon as any} />
            <Text style={styles.packButtonText}>{status !== ItemStatus.PENDING ? 'Đã đóng gói' : 'Đóng gói'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    minHeight: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  ribbonContainer: { position: 'absolute', top: 8, right: 8, width: 96, height: 32, overflow: 'visible' },
  ribbon: { position: 'absolute', right: -14, top: 6, width: 140, height: 26, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '18deg' }], borderRadius: 6 },
  ribbonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  contentContainer: { padding: 14 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 6, marginBottom: 8 },
  specsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FAFAFB', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8 },
  specItem: { alignItems: 'center', flex: 1 },
  specValue: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 4 },
  specLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconGroup: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2FF' },
  iconButtonDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', opacity: 0.5 },
  packButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  packButtonDisabled: { backgroundColor: '#9CA3AF' },
  packIcon: { width: 18, height: 18, color: '#fff', marginRight: 8 },
  packButtonText: { color: '#fff', fontWeight: '700' },
})

export default ItemCard