import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import itemService from '@/services/itemService'
import packageService from '@/services/packageService'

const ManagementCard: React.FC<{
  icon: React.ReactNode
  label: string
  description: string
  onPress?: () => void
  disabled?: boolean
}> = ({ icon, label, description, onPress, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>{disabled ? <ActivityIndicator size="small" color="#3B82F6" /> : icon}</View>
        <Text style={styles.arrowIcon}>›</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
    </TouchableOpacity>
  )
}

const ManagementTabs: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const go = async (path: string) => {
    try {
      setLoading(true)
      // Prefetch small datasets for snappy navigation
      if (path.includes('/(provider)/items')) {
        await itemService.getItemsByUserId({ pageNumber: 1, pageSize: 20 })
      } else if (path.includes('/(provider)/packages')) {
        await packageService.getPackagesByUserId({ pageNumber: 1, pageSize: 20 })
      }
      router.push(path)
    } catch (e) {
      console.warn('Navigation prefetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Quản lý</Text>

      <View style={styles.gridContainer}>
        <ManagementCard
          icon={<MaterialCommunityIcons name="cube-outline" size={28} color="#3B82F6" />}
          label="Quản lý hàng"
          description="Xem, thêm, chỉnh sửa sản phẩm"
          onPress={() => go('/(provider)/items')}
          disabled={loading}
        />

        <ManagementCard
          icon={<MaterialCommunityIcons name="package-variant-closed" size={28} color="#3B82F6" />}
          label="Quản lý kiện"
          description="Tạo nhóm gói, quản lý kiện hàng"
          onPress={() => go('/(provider)/packages')}
          disabled={loading}
        />

        <ManagementCard
          icon={<MaterialCommunityIcons name="post-outline" size={28} color="#3B82F6" />}
          label="Quản lý bài gửi"
          description="Tạo và quản lý bài đăng gửi hàng"
          onPress={() => go('/(provider)/posts')}
          disabled={loading}
        />
        
        <ManagementCard
          icon={<MaterialCommunityIcons name="receipt-text" size={28} color="#3B82F6" />}
          label="Quản lý Giao dịch"
          description="Lịch sử thu chi, nạp rút tiền"
          onPress={() => router.push({ pathname: '/shared/transactions', params: { roleTitle: 'Giao dịch - Nhà cung cấp' } })}
          disabled={loading}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0F172A',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#94A3B8',
    marginTop: -4,
  },
  textContainer: {
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
})

export default ManagementTabs