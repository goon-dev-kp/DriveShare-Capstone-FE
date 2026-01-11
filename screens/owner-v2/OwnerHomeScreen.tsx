import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HeaderOwner from './components/HeaderOwner'
import OwnerManagementTabs from './components/OwnerManagementTabs'
import WalletCard from '../../components/WalletCard'
import userService from '@/services/userService'
import walletService from '@/services/walletService'
import { ekycService } from '@/services/ekycService'
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const OwnerHomeScreen: React.FC = () => {
  const { user, wallet } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      // Load profile (contains verification status)
      const resp: any = await userService.getMyProfile()
      const prof = resp?.result ?? resp
      if (prof) {
        setProfile(prof)
        // Merge and persist
        const existing = useAuthStore.getState().user
        if (existing) {
          const merged = { 
            ...existing, 
            profile: prof, 
            userName: prof.fullName ?? existing.userName, 
            email: prof.email ?? existing.email, 
            phoneNumber: prof.phoneNumber ?? existing.phoneNumber, 
            avatarUrl: prof.avatarUrl ?? existing.avatarUrl,
            hasVerifiedCitizenId: prof.hasVerifiedCitizenId ?? false,
          }
          useAuthStore.setState({ user: merged })
          await AsyncStorage.setItem('user', JSON.stringify(merged))
        }
      }

      // Load wallet
      const wresp: any = await walletService.getMyWallet()
      const w = wresp?.result ?? wresp
      if (w) {
        useAuthStore.setState({ wallet: w })
        await AsyncStorage.setItem('wallet', JSON.stringify(w))
      }
    } catch (e) {
      console.warn('OwnerHome load failed', e)
    }
  }

  // Load data only when screen is focused (visible)
  useFocusEffect(
    React.useCallback(() => {
      loadData()
      return () => {}
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const displayProfile = profile ?? (user as any)?.profile ?? (user as any)?.result ?? (user as any) ?? {}
  // Map fields from profile, show fallback text when missing
  const totalVehicles = displayProfile?.totalVehicles ?? displayProfile?.totalVehicleCount ?? 'Chưa có dữ liệu'
  const totalDrivers = displayProfile?.totalDrivers ?? 'Chưa có dữ liệu'
  const totalTrips = displayProfile?.totalTripsCreated ?? displayProfile?.totalTrips ?? 'Chưa có dữ liệu'
  const rating = displayProfile?.averageRating ?? 'Chưa có dữ liệu'
  const companyName = displayProfile?.companyName ?? 'Chưa có dữ liệu'

  const balance = '150.500.000'

  // Xử lý sự kiện ví (để sau này code logic)
  const handleDeposit = () => console.log('Nạp tiền')
  const handleWithdraw = () => console.log('Rút tiền')

  // Component nhỏ cho thẻ thống kê (Stat Card)
  const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode, value: string, label: string, color: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* 1. Header (Background + Info Card) */}
        <HeaderOwner owner={user} onRefresh={onRefresh} refreshing={refreshing} />

        <View style={styles.bodyContent}>

          <WalletCard wallet={wallet} />
          {/* 2. Thống kê Hoạt động */}
          <View>
            <Text style={styles.sectionTitle}>Thống kê Hoạt động</Text>
            <View style={styles.statsGrid}>
              <StatCard 
                icon={<MaterialCommunityIcons name="truck-delivery" size={24} color="#3B82F6" />}
                value={String(totalVehicles)} 
                label="Xe đang hoạt động" 
                color="#EFF6FF"
              />
              <StatCard 
                icon={<MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />}
                value={String(totalDrivers)} 
                label="Tài xế sẵn sàng" 
                color="#EFF6FF"
              />
              <StatCard 
                icon={<MaterialCommunityIcons name="map-marker-path" size={24} color="#3B82F6" />}
                value={String(totalTrips)} 
                label="Chuyến đi hoàn thành" 
                color="#EFF6FF"
              />
              {/* <StatCard 
                icon={<MaterialCommunityIcons name="star" size={28} color="#3B82F6" />} 
                value={String(rating)} 
                label="Đánh giá trung bình" 
                color="#EFF6FF"
              /> */}
            </View>
          </View>

          {/* 3. Menu Quản lý */}
          <OwnerManagementTabs />
          
          {/* Padding bottom cho scroll thoáng */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Màu nền tổng thể hơi xám nhẹ dịu mắt
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  bodyContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  
  // Grid Thống kê
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statTextWrapper: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14,
  },
})

export default OwnerHomeScreen