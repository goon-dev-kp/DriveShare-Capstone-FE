import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
// import { TruckIcon } from '../../provider-v2/icons/StatIcon'
// import { CalendarDaysIcon } from '../../provider-v2/icons/ActionIcons'
// import { ArchiveBoxIcon } from '../../provider-v2/icons/ManagementIcons'

import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

// Component Card đơn lẻ trong Grid
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
      {/* Header Card: Icon & Arrow */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
            {disabled ? <ActivityIndicator size="small" color="#4F46E5" /> : icon}
        </View>
        {/* Mũi tên chỉ sang phải */}
        <Text style={styles.arrowIcon}>›</Text>
      </View>

      {/* Content */}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
    </TouchableOpacity>
  )
}

const OwnerManagementTabs: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const go = (path: string) => {
    setLoading(true)
    router.push(path)
    setLoading(false)
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Menu Quản lý</Text>
      
      <View style={styles.gridContainer}>
        {/* Card 1: Quản lý Đội xe */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="truck-outline" size={28} color="#3B82F6" />} 
          label="Quản lý Đội xe" 
          description="Thêm, sửa, xem trạng thái xe." 
          onPress={() => go('/(owner)/vehicles')} 
          disabled={loading} 
        />
        
        {/* Card 2: Quản lý Chuyến đi */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="map-legend" size={28} color="#3B82F6" />} 
          label="Quản lý Chuyến đi" 
          description="Theo dõi lộ trình, lịch sử." 
          onPress={() => go('/(owner)/trips')} 
          disabled={loading} 
        />
        
        {/* Card 3: Đăng tin Tìm Tài xế */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="account-search-outline" size={28} color="#3B82F6" />} // Có thể thay icon UserAdd nếu có
          label="Đăng tin Tìm Tài xế" 
          description="Tạo chuyến đi để kiếm tài." 
          onPress={() => go('/(owner)/trip-posts')} 
          disabled={loading} 
        />
        
        {/* Card 4: Săn Gói cước */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="package-variant-closed" size={28} color="#3B82F6" />} // Có thể thay icon SearchPackage
          label="Săn Gói cước (Từ NCC)" 
          description="Duyệt & nhận gói thầu." 
          onPress={() => go('/(owner)/provider-posts')} 
          disabled={loading} 
        />
        
        {/* Card 5: Quản lý Giao dịch */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="receipt-text" size={28} color="#3B82F6" />}
          label="Quản lý Giao dịch" 
          description="Lịch sử thu chi, nạp rút." 
          onPress={() => router.push({ pathname: '/shared/transactions', params: { roleTitle: 'Giao dịch - Chủ xe' } })} 
          disabled={loading} 
        />
        
        {/* Card 6: Quản lý Tài xế nội bộ */}
        <ManagementCard 
          icon={<MaterialCommunityIcons name="account-tie" size={28} color="#3B82F6" />}
          label="Quản lý Tài xế" 
          description="Danh sách tài xế, duyệt yêu cầu." 
          onPress={() => go('/(owner)/my-drivers')} 
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
    fontSize: 18, // Kích thước chữ tiêu đề section
    fontWeight: '700',
    marginBottom: 12,
    color: '#0F172A', // Xanh đen đậm
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Khoảng cách giữa các card
  },
  // Card Styles
  card: {
    width: '48%', // Chia đôi màn hình (trừ gap)
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
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
    backgroundColor: '#EFF6FF', // Nền xanh rất nhạt
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#3B82F6', // Icon màu xanh dương
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

export default OwnerManagementTabs