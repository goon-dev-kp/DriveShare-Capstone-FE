
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Provider } from '@/models/types'
import { useAuthStore } from '@/stores/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HeaderProvider from './components/HeaderProvider'
import Stats from './components/Stat'
import ManagementTabs from './components/ManagementTab'
import WalletCard from '../../components/WalletCard'
import { useAuth } from '@/hooks/useAuth'
import userService from '@/services/userService'
import walletService from '@/services/walletService'
import { ekycService } from '@/services/ekycService'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ProviderHomePageProps {
  provider?: Provider
}

const ProviderHomePage: React.FC<ProviderHomePageProps> = ({ provider }) => {
  const { user, wallet } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const providerData = (provider ?? profile ?? user) as Provider | undefined | null

  const loadData = async () => {
    try {
      const resp: any = await userService.getMyProfile()
      const prof = resp?.result ?? resp
      if (prof) {
        setProfile(prof)
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

      const wresp: any = await walletService.getMyWallet()
      const w = wresp?.result ?? wresp
      if (w) {
        useAuthStore.setState({ wallet: w })
        await AsyncStorage.setItem('wallet', JSON.stringify(w))
      }
    } catch (e) {
      console.warn('ProviderHome load failed', e)
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

  if (!providerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    )
  }

  const p = providerData as any
  const displayProfile = p?.profile ?? p?.result ?? p ?? {}
  const userName = displayProfile.fullName ?? displayProfile.userName ?? 'Nhà cung cấp'
  const companyName = displayProfile.companyName ?? displayProfile.company ?? 'Không có'
  const email = displayProfile.email ?? 'Không có'
  const phone = displayProfile.phoneNumber ?? 'Không có'
  const totalItems = displayProfile.totalItems ?? displayProfile.TotalItems ?? displayProfile.totalItemCount ?? 0
  const totalPackages = displayProfile.totalPackages ?? displayProfile.TotalPackages ?? displayProfile.totalPackageCount ?? 0
  const totalPackagePosts = displayProfile.totalPackagePosts ?? displayProfile.TotalPackagePosts ?? displayProfile.totalPackagePostsCount ?? 0
  const averageRating = displayProfile.averageRating ?? displayProfile.AverageRating ?? '-'

  const onCreatePost = () => console.log('Tạo bài đăng')
  const onCreatePackage = () => console.log('Tạo gói')

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <HeaderProvider provider={user} onRefresh={onRefresh} refreshing={refreshing} />

        <View style={styles.bodyContent}>
          <WalletCard wallet={wallet} />

          {/* <View style={[styles.card, styles.welcomeBanner]}>
            <Text style={styles.welcomeTitle}>Xin chào, {userName}</Text>
            <Text style={styles.welcomeSubtitle}>Quản lý gói hàng, bài đăng và doanh thu của bạn ở đây.</Text>
          </View>

          <View style={styles.infoCardContainer}>
            <InfoCard label="Công ty" value={companyName} />
            <InfoCard label="Email" value={email} />
            <InfoCard label="SĐT" value={phone} />
          </View> */}

          {/* <View style={styles.statCardContainer}>
            <StatCard label="Sản phẩm" value={String(totalItems)} />
            <StatCard label="Gói" value={String(totalPackages)} />
            <StatCard label="Bài đăng" value={String(totalPackagePosts)} />
            <StatCard label="Đánh giá" value={String(averageRating)} />
          </View>

          <Stats /> */}

          {/* 2. Thống kê Hoạt động */}
                    <View>
                      <Text style={styles.sectionTitle}>Thống kê Hoạt động</Text>
                      <View style={styles.statsGrid}>
                        <StatCard
                          icon={<MaterialCommunityIcons name="cube-outline" size={28} color="#3B82F6" />}
                          value={String(totalItems)}
                          label="Sản phẩm"
                          color="#EFF6FF"
                        />
                        <StatCard
                          icon={<MaterialCommunityIcons name="package-variant-closed" size={28} color="#3B82F6" />}
                          value={String(totalPackages)}
                          label="Gói"
                          color="#EFF6FF"
                        />
                        <StatCard
                          icon={<MaterialCommunityIcons name="post-outline" size={28} color="#3B82F6" />}
                          value={String(totalPackagePosts)}
                          label="Bài đăng"
                          color="#EFF6FF"
                        />
                        {/* <StatCard
                          icon={<MaterialCommunityIcons name="star" size={28} color="#3B82F6" />}
                          value={String(averageRating)}
                          label="Đánh giá trung bình"
                          color="#EFF6FF"
                        /> */}
                      </View>
                    </View>
          <ManagementTabs />

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Component phụ trợ
const InfoCard: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <View style={[styles.card, styles.infoCard]}>
<Text style={styles.infoCardLabel}>{label}</Text>
<Text style={styles.infoCardValue} numberOfLines={1}>
      {value}
    </Text>
</View>
)

const StatCard: React.FC<{ label: string; value: string | number; icon?: React.ReactNode; color?: string }> = ({
  label,
  value,
  icon,
  color,
}) => (
  <View style={[styles.card, styles.statCard]}>
    <View style={[styles.statIconContainer, { backgroundColor: color ?? '#EFF6FF' }]}>
      {icon}
    </View>
    <View style={styles.statTextWrapper}>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  </View>
)

// ĐỊNH NGHĨA STYLE BÊN DƯỚI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // bg-gray-100
    // Thêm dark mode logic ở đây nếu cần (dùng useColorScheme)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280', // text-gray-500
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  mainContent: {
    paddingHorizontal: 16, // px-4
    paddingTop: 16, // pt-4
    gap: 24, // space-y-6
  },
  // Style chung cho các thẻ
  card: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 12, // rounded-xl
    padding: 16, // p-4
    // Shadow cho iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Shadow cho Android
    elevation: 2,
  },
  welcomeBanner: {
    // shadow-sm
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  welcomeTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  welcomeSubtitle: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
    marginTop: 4, // mt-1
  },
  // Info Cards
  infoCardContainer: {
    gap: 12, // gap-3
  },
  infoCard: {
    // shadow-sm
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  infoCardLabel: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },
  infoCardValue: {
    fontSize: 16, // text-base
    fontWeight: '500', // font-medium
    color: '#111827', // text-gray-900
  },
  // Stat Cards
  statCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // gap-3
  },
  statCard: {
    width: '48%', // Chia đôi
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrapper: {
    flex: 1,
  },
  statCardLabel: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },
  statCardValue: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
  },
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12, // gap-3
  },
  actionButton: {
    flex: 1,
    padding: 12, // p-3
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#4F46E5', // bg-primary-500 (giả định)
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF', // text-white
    fontWeight: '600', // font-semibold
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF', // bg-white
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
  },
  actionButtonTextSecondary: {
    color: '#111827', // text-gray-900
    fontWeight: '600', // font-semibold
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
})

export default ProviderHomePage